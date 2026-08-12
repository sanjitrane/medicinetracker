/**
 * Core medicine domain types.
 *
 * Declarations only — no behaviour. The calculation engine (daily consumption,
 * finish date, remaining quantity, status) arrives in Phase 1C and lives in
 * `../utils`, so that it stays independently testable and out of components.
 *
 * Date convention: all dates are stored as ISO calendar dates ("YYYY-MM-DD"),
 * not timestamps. Medicine scheduling is a calendar-day concern, so storing
 * instants would drag timezone drift into every comparison.
 */

export type MedicineType = 'tablet' | 'syrup';

export type QuantityUnit = 'tablet' | 'ml';

export type DoseFraction = 'half' | 'full';

export type DoseTiming = 'before' | 'after';

export type Meal = 'breakfast' | 'lunch' | 'dinner';

/** A single scheduled dose at one point in the day. */
export interface Dose {
  quantity: number;
  unit: QuantityUnit;
  fraction?: DoseFraction;
  timing?: DoseTiming;
  meal?: Meal;
}

/**
 * The day's schedule, stored slot by slot.
 *
 * Deliberately NOT a shorthand like "1-1-1": the same shorthand means different
 * things to different prescribers, so each slot is stored explicitly.
 */
export interface DosageSchedule {
  morning?: Dose;
  afternoon?: Dose;
  evening?: Dose;
}

export type NotificationChannel = 'push' | 'whatsapp' | 'sms' | 'email';

export interface NotificationRule {
  enabled: boolean;
  daysBefore: number;
  /** Phase 1 only ever uses 'push' (local). Modelled now so Phase 2 can extend. */
  channels: NotificationChannel[];
}

export interface NotificationSettings {
  finishMedicine: NotificationRule;
  expiryMedicine: NotificationRule;
}

export interface Medicine {
  id: string;
  name: string;
  type: MedicineType;

  /** ISO "YYYY-MM" or "YYYY-MM-DD". Optional — packaging does not always show it. */
  manufacturingDate?: string;
  expiryDate?: string;

  /** ISO "YYYY-MM-DD". The day the course starts. */
  startDate: string;

  /** Total amount at the start of the course, in `quantityUnit`. */
  quantity: number;
  quantityUnit: QuantityUnit;

  // Tablet packaging, kept so the UI can show how the total was arrived at.
  tabletsPerStrip?: number;
  numberOfStrips?: number;

  // Syrup packaging.
  bottleQuantityMl?: number;

  dosage?: DosageSchedule;
  notificationSettings: NotificationSettings;

  /** ISO 8601 timestamps — these are instants, unlike the calendar dates above. */
  createdAt: string;
  updatedAt: string;
}

/**
 * Derived, never persisted. Computed from quantity, dosage, dates and today.
 * Priority when several apply: EXPIRED > FINISHED > EXPIRING_SOON >
 * FINISHING_SOON > ACTIVE.
 */
export type MedicineStatus =
  | 'ACTIVE'
  | 'FINISHING_SOON'
  | 'FINISHED'
  | 'EXPIRING_SOON'
  | 'EXPIRED';
