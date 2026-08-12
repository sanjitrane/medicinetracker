/**
 * Centralised date handling (architecture.md #24) — components never format
 * or parse dates themselves.
 *
 * `toISODate` deliberately reads local year/month/day rather than going
 * through `toISOString()`, which is UTC-based and can roll the calendar date
 * over near midnight in timezones ahead of UTC.
 */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function today(): string {
  return toISODate(new Date());
}

/** Parses a "YYYY-MM-DD" string as a local calendar date, not a UTC instant. */
export function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year as number, (month as number) - 1, day);
}

export function addDays(value: string, days: number): string {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** `to` minus `from`, in whole calendar days. Negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  // Rounded rather than floored: local-midnight instants can be 23h/25h
  // apart across a DST transition, which would otherwise off-by-one the count.
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / MS_PER_DAY);
}
