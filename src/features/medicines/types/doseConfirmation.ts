import type { DoseSlotKey } from './medicine';

/**
 * A record that one scheduled dose was actually taken. This is Phase 1D's
 * "actual consumption" (architecture.md #23) — kept entirely separate from
 * the finish-date/remaining-quantity engine (Phase 1C), which architecture.md
 * #23 explicitly says should keep using *expected* consumption for now.
 * Confirmations drive the "Today" checklist only; they do not feed back into
 * `medicineCalculator`.
 */
export interface DoseConfirmation {
  id: string;
  medicineId: string;
  /** ISO "YYYY-MM-DD" — the calendar day this dose belongs to, not `confirmedAt`'s day. */
  date: string;
  slot: DoseSlotKey;
  /** ISO 8601 instant of when the user confirmed it. */
  confirmedAt: string;
}
