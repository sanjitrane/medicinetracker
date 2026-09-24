import type { DoseSlotKey } from '@/features/medicines/types/medicine';

/** architecture.md #13's two notification types. */
export type NotificationType = 'MEDICINE_FINISHING' | 'MEDICINE_EXPIRING';

/**
 * What a local notification should look like once scheduled. Produced by
 * the pure planner (`notificationPlanner.ts`); consumed by the I/O scheduler
 * (`notificationScheduler.ts`), which is the only place that talks to
 * `expo-notifications`.
 */
export interface PlannedNotification {
  identifier: string;
  medicineId: string;
  type: NotificationType;
  triggerDate: Date;
  title: string;
  body: string;
}

/**
 * A daily-repeating dose alarm. Produced by the pure planner
 * (`doseReminderPlanner.ts`); consumed by the I/O scheduler
 * (`doseReminderScheduler.ts`). Uses `hour`/`minute` rather than a `Date`
 * because it maps to a `DAILY` trigger, which repeats every day at that
 * clock time rather than firing once.
 */
export interface PlannedDoseReminder {
  identifier: string;
  medicineId: string;
  slot: DoseSlotKey;
  hour: number;
  minute: number;
  title: string;
  body: string;
}
