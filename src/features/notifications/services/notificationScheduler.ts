import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

import type { Medicine } from '@/features/medicines/types/medicine';

import { allNotificationIdentifiers, computeNotificationPlan } from '../utils/notificationPlanner';

const ANDROID_CHANNEL_ID = 'default';

let handlerConfigured = false;
let askedThisSession = false;

/**
 * Sets the foreground presentation handler and the Android channel. Safe to
 * call at app launch (architecture.md #36) — unlike requesting permission,
 * this never prompts the user.
 */
export function configureNotifications(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Medicine reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch(() => undefined);
  }
}

export async function getNotificationPermissionGranted(): Promise<boolean> {
  const status = await Notifications.getPermissionsAsync();
  return status.granted;
}

/**
 * architecture.md #36: ask with context before the bare OS dialog, and only
 * once per undetermined session — not on every save, and never once the
 * user has actually said no at the OS level (`canAskAgain` false).
 */
async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain || askedThisSession) return false;

  askedThisSession = true;

  const wantsReminders = await new Promise<boolean>((resolve) => {
    Alert.alert(
      'Stay on track',
      'Would you like reminders when your medicine is running out or expiring?',
      [
        { text: 'Not Now', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Enable Reminders', onPress: () => resolve(true) },
      ]
    );
  });
  if (!wantsReminders) return false;

  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

async function cancelAll(identifiers: string[]): Promise<void> {
  await Promise.all(
    identifiers.map((identifier) => Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined))
  );
}

/**
 * architecture.md #13: cancels this medicine's notifications and recreates
 * whatever `computeNotificationPlan` says should exist right now — the same
 * path whether the medicine is brand new or an existing one just edited
 * ("cancelled and recreated"), and naturally idempotent, which is what rules
 * out duplicates.
 */
export async function syncMedicineNotifications(medicine: Medicine, patientName: string): Promise<void> {
  try {
    configureNotifications();
    await cancelAll(allNotificationIdentifiers(medicine.id));

    const plan = computeNotificationPlan(medicine, patientName);
    if (plan.length === 0) return;

    const granted = await ensurePermission();
    if (!granted) return;

    for (const item of plan) {
      await Notifications.scheduleNotificationAsync({
        identifier: item.identifier,
        content: { title: item.title, body: item.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.triggerDate },
      });
    }
  } catch {
    // architecture.md #35: scheduling must never crash the app or block
    // saving a medicine — the medicine is already saved by this point.
  }
}

export async function cancelMedicineNotifications(medicineId: string): Promise<void> {
  try {
    await cancelAll(allNotificationIdentifiers(medicineId));
  } catch {
    // Best-effort cleanup on delete; nothing to recover.
  }
}
