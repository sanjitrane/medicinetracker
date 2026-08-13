import type { Medicine } from '@/features/medicines/types/medicine';
import {
  calculateExpiryNotificationDate,
  calculateFinishNotificationDate,
  calculateMedicineFinishDate,
  normalizeExpiryDate,
} from '@/features/medicines/utils/medicineCalculator';
import { parseISODate } from '@/utils/dateUtils';

import type { NotificationType, PlannedNotification } from '../types/notification';

/** Local reminder time-of-day — fixed for Phase 1, not user-configurable. */
const NOTIFICATION_HOUR = 9;

export function notificationIdentifier(medicineId: string, type: NotificationType): string {
  return type === 'MEDICINE_FINISHING'
    ? `medicine-${medicineId}-finishing`
    : `medicine-${medicineId}-expiring`;
}

export function allNotificationIdentifiers(medicineId: string): string[] {
  return [
    notificationIdentifier(medicineId, 'MEDICINE_FINISHING'),
    notificationIdentifier(medicineId, 'MEDICINE_EXPIRING'),
  ];
}

function atNotificationTime(dateStr: string): Date {
  const date = parseISODate(dateStr);
  date.setHours(NOTIFICATION_HOUR, 0, 0, 0);
  return date;
}

/**
 * architecture.md #13: what notifications SHOULD exist for this medicine
 * right now. The I/O scheduler cancels everything for the medicine and
 * (re)creates whatever this returns — the same path for a brand-new medicine
 * or a rescheduled edit (architecture.md #13's "cancelled and recreated").
 *
 * Pure function of the medicine and "now", so every rule (toggle off,
 * missing expiry, an already-past trigger) is independently testable
 * (architecture.md #40 #11) without a device or the notifications API.
 *
 * `patientName` is required, not looked up here — phase2_architecture.md
 * #14: "A notification should contain enough information to identify the
 * patient", but resolving a name from a patientId is store/repository
 * territory, which this pure function deliberately stays free of.
 */
export function computeNotificationPlan(
  medicine: Medicine,
  patientName: string,
  now: Date = new Date()
): PlannedNotification[] {
  const plan: PlannedNotification[] = [];

  const finishRule = medicine.notificationSettings.finishMedicine;
  if (finishRule.enabled) {
    const finishDate = calculateMedicineFinishDate(medicine);
    if (finishDate) {
      const triggerDate = atNotificationTime(
        calculateFinishNotificationDate(finishDate, finishRule.daysBefore)
      );
      if (triggerDate.getTime() > now.getTime()) {
        plan.push({
          identifier: notificationIdentifier(medicine.id, 'MEDICINE_FINISHING'),
          medicineId: medicine.id,
          type: 'MEDICINE_FINISHING',
          triggerDate,
          title: `${patientName}: ${medicine.name} is running low`,
          body: `Based on the dosage, this is expected to run out around ${finishDate}.`,
        });
      }
    }
  }

  const expiryRule = medicine.notificationSettings.expiryMedicine;
  if (expiryRule.enabled && medicine.expiryDate) {
    const expiry = normalizeExpiryDate(medicine.expiryDate);
    const triggerDate = atNotificationTime(calculateExpiryNotificationDate(expiry, expiryRule.daysBefore));
    if (triggerDate.getTime() > now.getTime()) {
      plan.push({
        identifier: notificationIdentifier(medicine.id, 'MEDICINE_EXPIRING'),
        medicineId: medicine.id,
        type: 'MEDICINE_EXPIRING',
        triggerDate,
        title: `${patientName}: ${medicine.name} is expiring soon`,
        body: `This expires on ${expiry}.`,
      });
    }
  }

  return plan;
}
