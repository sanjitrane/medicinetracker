import { addDays, daysBetween, parseISODate, toISODate, today } from '../dateUtils';

describe('toISODate / parseISODate', () => {
  it('round-trips a local date without a UTC shift', () => {
    const date = new Date(2026, 7, 12); // 12 Aug 2026
    expect(toISODate(date)).toBe('2026-08-12');
    expect(parseISODate('2026-08-12').getTime()).toBe(date.getTime());
  });

  it('pads single-digit months and days', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('today', () => {
  it('matches the current local date', () => {
    expect(today()).toBe(toISODate(new Date()));
  });
});

describe('addDays', () => {
  it('adds days within a month', () => {
    expect(addDays('2026-08-12', 3)).toBe('2026-08-15');
  });

  it('rolls over a month boundary', () => {
    expect(addDays('2026-08-30', 3)).toBe('2026-09-02');
  });

  it('rolls over a year boundary', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('subtracts with a negative offset', () => {
    expect(addDays('2026-08-12', -5)).toBe('2026-08-07');
  });

  it('is a no-op for zero days', () => {
    expect(addDays('2026-08-12', 0)).toBe('2026-08-12');
  });
});

describe('daysBetween', () => {
  it('counts forward whole days', () => {
    expect(daysBetween('2026-08-12', '2026-08-15')).toBe(3);
  });

  it('is negative when `to` precedes `from`', () => {
    expect(daysBetween('2026-08-15', '2026-08-12')).toBe(-3);
  });

  it('is zero for the same date', () => {
    expect(daysBetween('2026-08-12', '2026-08-12')).toBe(0);
  });

  it('spans a month boundary', () => {
    expect(daysBetween('2026-08-30', '2026-09-02')).toBe(3);
  });
});
