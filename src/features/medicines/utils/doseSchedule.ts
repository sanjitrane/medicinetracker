import { toISODate } from '@/utils/dateUtils';

import type { DoseConfirmation } from '../types/doseConfirmation';
import type { Dose, DoseSlotKey, Medicine } from '../types/medicine';
import { getMedicineStatus } from './medicineCalculator';

export interface DoseSlotWindow {
  slot: DoseSlotKey;
  label: string;
  /** Both bounds inclusive, 24h clock — hour `endHour` still counts as "in window". */
  startHour: number;
  endHour: number;
}

/** architecture.md #41 (Phase 1D): the three fixed windows a dose can fall in. */
export const DOSE_SLOT_WINDOWS: readonly DoseSlotWindow[] = [
  { slot: 'morning', label: 'Morning', startHour: 6, endHour: 11 },
  { slot: 'afternoon', label: 'Afternoon', startHour: 12, endHour: 15 },
  { slot: 'evening', label: 'Evening', startHour: 20, endHour: 23 },
];

/** Chronological slot order — what "sorted based on the dosage timing" means. */
export const DOSE_SLOT_ORDER: readonly DoseSlotKey[] = DOSE_SLOT_WINDOWS.map((w) => w.slot);

export function getSlotWindow(slot: DoseSlotKey): DoseSlotWindow {
  const window = DOSE_SLOT_WINDOWS.find((w) => w.slot === slot);
  if (!window) {
    throw new Error(`Unknown dose slot: ${slot}`);
  }
  return window;
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelveHour} ${period}`;
}

export function formatSlotWindow(slot: DoseSlotKey): string {
  const window = getSlotWindow(slot);
  return `${window.label} · ${formatHour(window.startHour)}–${formatHour(window.endHour)}`;
}

export type DoseTimingStatus = 'done' | 'overdue' | 'due' | 'upcoming';

/**
 * architecture.md #41: "If the user has not confirmed his consumption ...
 * display alert". Read here as a visual flag on the item ('overdue'), not a
 * modal popup — the app has no other interruptive alerts, and a checklist is
 * exactly the kind of thing a user re-opens rather than gets pushed at.
 */
export function getDoseTimingStatus(
  slot: DoseSlotKey,
  isConfirmed: boolean,
  now: Date = new Date()
): DoseTimingStatus {
  if (isConfirmed) return 'done';

  const window = getSlotWindow(slot);
  const hour = now.getHours();

  if (hour > window.endHour) return 'overdue';
  if (hour >= window.startHour) return 'due';
  return 'upcoming';
}

export interface TodaysDoseItem {
  medicineId: string;
  medicineName: string;
  slot: DoseSlotKey;
  dose: Dose;
  isConfirmed: boolean;
  timingStatus: DoseTimingStatus;
}

/**
 * Assembles today's checklist, one entry per scheduled slot per medicine —
 * a medicine due morning and afternoon produces two entries (architecture.md
 * #41's "tabletX" example) — and sorts them by time of day.
 *
 * Excludes medicines that have not started yet, and ones already FINISHED or
 * EXPIRED: there is nothing to confirm for medicine you don't have or
 * shouldn't take. This does not feed back into `medicineCalculator` — see
 * `DoseConfirmation`'s doc comment for why.
 */
export function buildTodaysDoseItems(
  medicines: Medicine[],
  confirmations: DoseConfirmation[],
  now: Date = new Date()
): TodaysDoseItem[] {
  const todayDate = toISODate(now);
  const confirmedSlots = new Set(
    confirmations.filter((c) => c.date === todayDate).map((c) => `${c.medicineId}:${c.slot}`)
  );

  const items: TodaysDoseItem[] = [];

  medicines.forEach((medicine) => {
    if (!medicine.dosage) return;
    if (medicine.startDate > todayDate) return;

    const status = getMedicineStatus(medicine, todayDate);
    if (status === 'FINISHED' || status === 'EXPIRED') return;

    DOSE_SLOT_ORDER.forEach((slot) => {
      const dose = medicine.dosage?.[slot];
      if (!dose || dose.quantity <= 0) return;

      const isConfirmed = confirmedSlots.has(`${medicine.id}:${slot}`);
      items.push({
        medicineId: medicine.id,
        medicineName: medicine.name,
        slot,
        dose,
        isConfirmed,
        timingStatus: getDoseTimingStatus(slot, isConfirmed, now),
      });
    });
  });

  return items.sort((a, b) => {
    const slotDiff = DOSE_SLOT_ORDER.indexOf(a.slot) - DOSE_SLOT_ORDER.indexOf(b.slot);
    return slotDiff !== 0 ? slotDiff : a.medicineName.localeCompare(b.medicineName);
  });
}
