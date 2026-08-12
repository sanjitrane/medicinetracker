import { addDays, daysBetween, today } from '@/utils/dateUtils';

import type { DosageSchedule, Medicine, MedicineStatus } from '../types/medicine';

type ConsumptionInput = Pick<Medicine, 'quantity' | 'dosage' | 'startDate'>;

const MONTH_ONLY = /^\d{4}-\d{2}$/;

/**
 * Sum of every dosage slot, in the medicine's own unit. A missing dosage
 * schedule means "not recorded yet" — Phase 1B allows saving without one —
 * so callers must treat 0 as "un-computable", not "never taken".
 */
export function calculateDailyConsumption(dosage?: DosageSchedule): number {
  if (!dosage) return 0;
  return (
    (dosage.morning?.quantity ?? 0) +
    (dosage.afternoon?.quantity ?? 0) +
    (dosage.evening?.quantity ?? 0)
  );
}

/**
 * architecture.md #9: quantity / dailyConsumption is the days of supply, and
 * the course finishes on day N of that supply — not N days *after* the start
 * date, since the start date is itself the first day of dosing. 30 tablets
 * at 3/day is a 10-day supply that finishes on Start + 9, not Start + 10.
 * A partial final day rounds up (ceil), so the estimate never promises
 * medicine that has already run out.
 */
export function calculateMedicineFinishDate(medicine: ConsumptionInput): string | undefined {
  const dailyConsumption = calculateDailyConsumption(medicine.dosage);
  if (dailyConsumption <= 0) return undefined;

  const daysSupply = Math.ceil(medicine.quantity / dailyConsumption);
  return addDays(medicine.startDate, Math.max(daysSupply - 1, 0));
}

/**
 * architecture.md #22: derived from elapsed whole days since the start date,
 * never mutated from the stored quantity. A day only counts as "consumed"
 * once it has fully elapsed — the worked example is 3 elapsed days into a
 * course consuming 3 days' worth, not 4 — so on the finish date itself there
 * is still (up to) one day's dose outstanding; remaining only reaches zero
 * the day *after* the estimated finish date. That lag is intentional: the
 * finish day is the day the last dose is taken, not the day after it.
 */
export function calculateRemainingQuantity(
  medicine: ConsumptionInput,
  asOfDate: string = today()
): number {
  const dailyConsumption = calculateDailyConsumption(medicine.dosage);
  if (dailyConsumption <= 0) return medicine.quantity;

  const elapsedDays = Math.max(daysBetween(medicine.startDate, asOfDate), 0);
  const consumed = dailyConsumption * elapsedDays;
  return Math.max(medicine.quantity - consumed, 0);
}

export function calculateFinishNotificationDate(finishDate: string, daysBefore: number): string {
  return addDays(finishDate, -daysBefore);
}

export function calculateExpiryNotificationDate(expiryDate: string, daysBefore: number): string {
  return addDays(normalizeExpiryDate(expiryDate), -daysBefore);
}

/**
 * Packaging often only prints MM/YYYY (architecture.md #4). Treated as valid
 * through the end of that month — the safer reading, since warning the user
 * a little early beats saying "expired" while the pack is still in date.
 */
export function normalizeExpiryDate(expiryDate: string): string {
  if (!MONTH_ONLY.test(expiryDate)) return expiryDate;

  const [year, month] = expiryDate.split('-').map(Number);
  // Day 0 of the (0-indexed) given month == the last day of that month.
  const lastDay = new Date(year as number, month as number, 0).getDate();
  return `${expiryDate}-${String(lastDay).padStart(2, '0')}`;
}

/**
 * Priority when several apply (architecture.md #8):
 * EXPIRED > FINISHED > EXPIRING_SOON > FINISHING_SOON > ACTIVE.
 *
 * "Soon" thresholds reuse the medicine's own reminder lead times rather than
 * a separate hardcoded number — the status badge and the push notification
 * are the same warning window, just two presentations of it. This applies
 * regardless of whether the reminder itself is enabled: disabling the push
 * silences the notification, not the dashboard's own warning.
 */
export function getMedicineStatus(medicine: Medicine, asOfDate: string = today()): MedicineStatus {
  if (medicine.expiryDate) {
    const expiry = normalizeExpiryDate(medicine.expiryDate);
    if (daysBetween(asOfDate, expiry) < 0) return 'EXPIRED';
  }

  const finishDate = calculateMedicineFinishDate(medicine);
  const remaining = calculateRemainingQuantity(medicine, asOfDate);
  if (finishDate && remaining <= 0) return 'FINISHED';

  if (medicine.expiryDate) {
    const expiry = normalizeExpiryDate(medicine.expiryDate);
    const daysToExpiry = daysBetween(asOfDate, expiry);
    if (daysToExpiry >= 0 && daysToExpiry <= medicine.notificationSettings.expiryMedicine.daysBefore) {
      return 'EXPIRING_SOON';
    }
  }

  if (finishDate) {
    const daysToFinish = daysBetween(asOfDate, finishDate);
    if (daysToFinish >= 0 && daysToFinish <= medicine.notificationSettings.finishMedicine.daysBefore) {
      return 'FINISHING_SOON';
    }
  }

  return 'ACTIVE';
}
