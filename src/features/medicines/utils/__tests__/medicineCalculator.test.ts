import {
  calculateDailyConsumption,
  calculateExpiryNotificationDate,
  calculateFinishNotificationDate,
  calculateMedicineFinishDate,
  calculateRemainingQuantity,
  getMedicineStatus,
  normalizeExpiryDate,
} from '../medicineCalculator';
import type { DosageSchedule, Medicine } from '../../types/medicine';

function buildMedicine(overrides: Partial<Medicine> = {}): Medicine {
  return {
    id: 'm1',
    patientId: 'p1',
    name: 'Paracetamol',
    type: 'tablet',
    startDate: '2026-08-12',
    quantity: 30,
    quantityUnit: 'tablet',
    tabletsPerStrip: 10,
    numberOfStrips: 3,
    dosage: {
      morning: { quantity: 1, unit: 'tablet' },
      afternoon: { quantity: 1, unit: 'tablet' },
      evening: { quantity: 1, unit: 'tablet' },
    },
    notificationSettings: {
      finishMedicine: { enabled: true, daysBefore: 3, channels: ['push'] },
      expiryMedicine: { enabled: true, daysBefore: 7, channels: ['push'] },
    },
    createdAt: '2026-08-12T00:00:00.000Z',
    updatedAt: '2026-08-12T00:00:00.000Z',
    ...overrides,
  };
}

describe('calculateDailyConsumption', () => {
  it('sums a 1 tablet/day schedule', () => {
    const dosage: DosageSchedule = { morning: { quantity: 1, unit: 'tablet' } };
    expect(calculateDailyConsumption(dosage)).toBe(1);
  });

  it('sums a 3 tablets/day (1-1-1) schedule', () => {
    const dosage: DosageSchedule = {
      morning: { quantity: 1, unit: 'tablet' },
      afternoon: { quantity: 1, unit: 'tablet' },
      evening: { quantity: 1, unit: 'tablet' },
    };
    expect(calculateDailyConsumption(dosage)).toBe(3);
  });

  it('sums half-tablet doses', () => {
    const dosage: DosageSchedule = {
      morning: { quantity: 0.5, unit: 'tablet' },
      evening: { quantity: 0.5, unit: 'tablet' },
    };
    expect(calculateDailyConsumption(dosage)).toBe(1);
  });

  it('sums fractional syrup doses', () => {
    const dosage: DosageSchedule = {
      morning: { quantity: 5, unit: 'ml' },
      evening: { quantity: 5.5, unit: 'ml' },
    };
    expect(calculateDailyConsumption(dosage)).toBe(10.5);
  });

  it('is zero when no dosage is recorded', () => {
    expect(calculateDailyConsumption(undefined)).toBe(0);
  });

  it('is zero for an "empty" dosage schedule (invalid dosage)', () => {
    expect(calculateDailyConsumption({})).toBe(0);
  });
});

describe('calculateMedicineFinishDate', () => {
  it('matches the architecture.md tablet example: 30 @ 3/day from 12 Aug -> 21 Aug', () => {
    const medicine = buildMedicine({ quantity: 30, startDate: '2026-08-12' });
    expect(calculateMedicineFinishDate(medicine)).toBe('2026-08-21');
  });

  it('matches the architecture.md syrup example: 100ml @ 15ml/day from 12 Aug -> ~18 Aug', () => {
    const medicine = buildMedicine({
      type: 'syrup',
      quantity: 100,
      quantityUnit: 'ml',
      bottleQuantityMl: 100,
      startDate: '2026-08-12',
      dosage: {
        morning: { quantity: 5, unit: 'ml' },
        afternoon: { quantity: 5, unit: 'ml' },
        evening: { quantity: 5, unit: 'ml' },
      },
    });
    expect(calculateMedicineFinishDate(medicine)).toBe('2026-08-18');
  });

  it('finishes the same day it starts when supply is exactly one day', () => {
    const medicine = buildMedicine({
      quantity: 3,
      startDate: '2026-08-12',
      dosage: { morning: { quantity: 3, unit: 'tablet' } },
    });
    expect(calculateMedicineFinishDate(medicine)).toBe('2026-08-12');
  });

  it('finishes the day after it starts for a two-day supply', () => {
    const medicine = buildMedicine({
      quantity: 6,
      startDate: '2026-08-12',
      dosage: { morning: { quantity: 3, unit: 'tablet' } },
    });
    expect(calculateMedicineFinishDate(medicine)).toBe('2026-08-13');
  });

  it('is undefined when there is no dosage to project from (invalid dosage)', () => {
    const medicine = buildMedicine({ dosage: undefined });
    expect(calculateMedicineFinishDate(medicine)).toBeUndefined();
  });
});

describe('calculateRemainingQuantity', () => {
  it('matches the architecture.md example: 30 @ 3/day, 3 elapsed days -> 21 left', () => {
    const medicine = buildMedicine({ quantity: 30, startDate: '2026-08-12' });
    expect(calculateRemainingQuantity(medicine, '2026-08-15')).toBe(21);
  });

  it('is the full quantity when the start date is today', () => {
    const medicine = buildMedicine({ quantity: 30, startDate: '2026-08-12' });
    expect(calculateRemainingQuantity(medicine, '2026-08-12')).toBe(30);
  });

  it('is the full quantity when the start date is in the future', () => {
    const medicine = buildMedicine({ quantity: 30, startDate: '2026-08-20' });
    expect(calculateRemainingQuantity(medicine, '2026-08-12')).toBe(30);
  });

  it('never goes negative once the course has run past its supply', () => {
    const medicine = buildMedicine({ quantity: 30, startDate: '2026-08-12' });
    expect(calculateRemainingQuantity(medicine, '2027-01-01')).toBe(0);
  });

  it('is unaffected by asOfDate when there is no dosage (invalid dosage)', () => {
    const medicine = buildMedicine({ quantity: 30, dosage: undefined });
    expect(calculateRemainingQuantity(medicine, '2026-12-01')).toBe(30);
  });

  it('still shows a partial day outstanding on the estimated finish date', () => {
    // 30 @ 3/day from 12 Aug finishes 21 Aug: the last dose is taken *on*
    // that day, so remaining should not have already hit zero.
    const medicine = buildMedicine({ quantity: 30, startDate: '2026-08-12' });
    expect(calculateRemainingQuantity(medicine, '2026-08-21')).toBeGreaterThan(0);
    expect(calculateRemainingQuantity(medicine, '2026-08-22')).toBe(0);
  });
});

describe('calculateFinishNotificationDate', () => {
  it('matches the architecture.md example: finishes 25 Aug, 3 days before -> 22 Aug', () => {
    expect(calculateFinishNotificationDate('2026-08-25', 3)).toBe('2026-08-22');
  });
});

describe('calculateExpiryNotificationDate', () => {
  it('matches the architecture.md example: expires 30 Sep, 7 days before -> 23 Sep', () => {
    expect(calculateExpiryNotificationDate('2026-09-30', 7)).toBe('2026-09-23');
  });

  it('normalizes a month-only expiry before applying the lead time', () => {
    expect(calculateExpiryNotificationDate('2026-09', 7)).toBe('2026-09-23');
  });

  it('can land in the past relative to today — that is a scheduling concern, not a compute error', () => {
    expect(calculateExpiryNotificationDate('2020-01-01', 30)).toBe('2019-12-02');
  });
});

describe('normalizeExpiryDate', () => {
  it('leaves a full date untouched', () => {
    expect(normalizeExpiryDate('2026-08-15')).toBe('2026-08-15');
  });

  it('resolves a month-only date to its last day', () => {
    expect(normalizeExpiryDate('2026-08')).toBe('2026-08-31');
  });

  it('accounts for a non-leap February', () => {
    expect(normalizeExpiryDate('2025-02')).toBe('2025-02-28');
  });

  it('accounts for a leap February', () => {
    expect(normalizeExpiryDate('2024-02')).toBe('2024-02-29');
  });
});

describe('getMedicineStatus', () => {
  it('is EXPIRED once the expiry date has passed, even with plenty of quantity left', () => {
    const medicine = buildMedicine({
      quantity: 30,
      startDate: '2026-08-12',
      expiryDate: '2026-08-01',
    });
    expect(getMedicineStatus(medicine, '2026-08-12')).toBe('EXPIRED');
  });

  it('is not EXPIRED on the expiry date itself', () => {
    const medicine = buildMedicine({ expiryDate: '2026-09-30' });
    expect(getMedicineStatus(medicine, '2026-09-30')).not.toBe('EXPIRED');
  });

  it('is FINISHED the day after the estimated finish date', () => {
    const medicine = buildMedicine({
      quantity: 30,
      startDate: '2026-08-12',
      expiryDate: '2027-01-01',
    });
    expect(getMedicineStatus(medicine, '2026-08-22')).toBe('FINISHED');
  });

  it('is EXPIRING_SOON inside the expiry reminder window', () => {
    const medicine = buildMedicine({
      quantity: 30,
      startDate: '2026-08-12',
      expiryDate: '2026-08-16',
      notificationSettings: {
        finishMedicine: { enabled: true, daysBefore: 1, channels: ['push'] },
        expiryMedicine: { enabled: true, daysBefore: 7, channels: ['push'] },
      },
    });
    expect(getMedicineStatus(medicine, '2026-08-12')).toBe('EXPIRING_SOON');
  });

  it('is FINISHING_SOON inside the finish reminder window', () => {
    const medicine = buildMedicine({
      quantity: 30,
      startDate: '2026-08-12',
      expiryDate: '2027-01-01',
      notificationSettings: {
        finishMedicine: { enabled: true, daysBefore: 3, channels: ['push'] },
        expiryMedicine: { enabled: true, daysBefore: 7, channels: ['push'] },
      },
    });
    // Finishes 21 Aug; 19 Aug is 2 days out, inside the 3-day window.
    expect(getMedicineStatus(medicine, '2026-08-19')).toBe('FINISHING_SOON');
  });

  it('still reports FINISHING_SOON when the reminder itself is disabled', () => {
    const medicine = buildMedicine({
      quantity: 30,
      startDate: '2026-08-12',
      expiryDate: '2027-01-01',
      notificationSettings: {
        finishMedicine: { enabled: false, daysBefore: 3, channels: ['push'] },
        expiryMedicine: { enabled: true, daysBefore: 7, channels: ['push'] },
      },
    });
    expect(getMedicineStatus(medicine, '2026-08-19')).toBe('FINISHING_SOON');
  });

  it('is ACTIVE well within both windows', () => {
    const medicine = buildMedicine({
      quantity: 30,
      startDate: '2026-08-12',
      expiryDate: '2027-01-01',
    });
    expect(getMedicineStatus(medicine, '2026-08-12')).toBe('ACTIVE');
  });

  it('is ACTIVE when there is no expiry date and no dosage recorded (invalid dosage)', () => {
    const medicine = buildMedicine({ expiryDate: undefined, dosage: undefined });
    expect(getMedicineStatus(medicine, '2026-08-12')).toBe('ACTIVE');
  });

  it('prioritises EXPIRED over a simultaneously-true FINISHING_SOON', () => {
    const medicine = buildMedicine({
      quantity: 30,
      startDate: '2026-08-12',
      expiryDate: '2026-08-01',
      notificationSettings: {
        finishMedicine: { enabled: true, daysBefore: 30, channels: ['push'] },
        expiryMedicine: { enabled: true, daysBefore: 7, channels: ['push'] },
      },
    });
    expect(getMedicineStatus(medicine, '2026-08-12')).toBe('EXPIRED');
  });

  it('prioritises FINISHED over a simultaneously-true EXPIRING_SOON', () => {
    const medicine = buildMedicine({
      quantity: 30,
      startDate: '2026-08-12',
      expiryDate: '2026-08-30',
      notificationSettings: {
        finishMedicine: { enabled: true, daysBefore: 3, channels: ['push'] },
        expiryMedicine: { enabled: true, daysBefore: 30, channels: ['push'] },
      },
    });
    // Finishes 21 Aug (remaining hits 0 on 22 Aug); expiry window is huge too.
    expect(getMedicineStatus(medicine, '2026-08-22')).toBe('FINISHED');
  });
});
