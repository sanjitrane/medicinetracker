import type { DoseSlotKey, Medicine } from '@/features/medicines/types/medicine';
import { DOSE_SLOT_ORDER, getSlotWindow } from '@/features/medicines/utils/doseSchedule';

import type { PlannedDoseReminder } from '../types/notification';

export function doseReminderIdentifier(medicineId: string, slot: DoseSlotKey): string {
  return `medicine-${medicineId}-dose-${slot}`;
}

export function allDoseReminderIdentifiers(medicineId: string): string[] {
  return DOSE_SLOT_ORDER.map((slot) => doseReminderIdentifier(medicineId, slot));
}

function parseTime(time: string): { hour: number; minute: number } | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

/**
 * What daily dose alarms SHOULD exist for this medicine right now. Mirrors
 * `computeNotificationPlan`'s "cancel and recreate" shape: the I/O scheduler
 * cancels every dose-reminder identifier for the medicine and (re)creates
 * whatever this returns, so it's the same path for a brand-new time or an
 * edited one.
 *
 * Only slots with a positive quantity AND an explicit `time` produce a
 * reminder — a dosage slot with no time set has nothing to alarm on yet.
 */
export function computeDoseReminderPlan(medicine: Medicine, patientName: string): PlannedDoseReminder[] {
  if (!medicine.dosage) return [];

  const plan: PlannedDoseReminder[] = [];

  DOSE_SLOT_ORDER.forEach((slot) => {
    const dose = medicine.dosage?.[slot];
    if (!dose || dose.quantity <= 0 || !dose.time) return;

    const parsed = parseTime(dose.time);
    if (!parsed) return;

    plan.push({
      identifier: doseReminderIdentifier(medicine.id, slot),
      medicineId: medicine.id,
      slot,
      hour: parsed.hour,
      minute: parsed.minute,
      title: `${patientName}: time for ${medicine.name}`,
      body: `Take ${dose.quantity} ${dose.unit} — ${getSlotWindow(slot).label}`,
    });
  });

  return plan;
}
