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
