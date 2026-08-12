/**
 * Time-of-day greeting for the dashboard header.
 *
 * Lives outside the component so the dashboard stays free of logic and this
 * stays testable — the boundaries are a product decision, not an accident.
 */
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
