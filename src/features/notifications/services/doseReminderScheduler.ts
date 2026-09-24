import * as Notifications from 'expo-notifications';

import type { Medicine } from '@/features/medicines/types/medicine';

import { cancelScheduledIdentifiers, configureNotifications, ensurePermission } from './notificationScheduler';
import { allDoseReminderIdentifiers, computeDoseReminderPlan } from '../utils/doseReminderPlanner';

/**
 * Cancels this medicine's dose-time alarms and recreates whatever
 * `computeDoseReminderPlan` says should exist right now — same
 * "cancel and recreate" path as `syncMedicineNotifications`, called
 * whenever a medicine (including its dosage times) is saved.
 */
export async function syncDoseReminders(medicine: Medicine, patientName: string): Promise<void> {
  try {
    configureNotifications();
    await cancelScheduledIdentifiers(allDoseReminderIdentifiers(medicine.id));

    const plan = computeDoseReminderPlan(medicine, patientName);
    if (plan.length === 0) return;

    const granted = await ensurePermission();
    if (!granted) return;

    for (const item of plan) {
      await Notifications.scheduleNotificationAsync({
        identifier: item.identifier,
        content: { title: item.title, body: item.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: item.hour,
          minute: item.minute,
        },
      });
    }
  } catch {
    // Scheduling must never crash the app or block saving — the medicine is
    // already saved by this point (architecture.md #35).
  }
}

export async function cancelDoseReminders(medicineId: string): Promise<void> {
  try {
    await cancelScheduledIdentifiers(allDoseReminderIdentifiers(medicineId));
  } catch {
    // Best-effort cleanup on delete; nothing to recover.
  }
}
