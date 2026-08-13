import {
  allNotificationIdentifiers,
  computeNotificationPlan,
  notificationIdentifier,
} from '../notificationPlanner';
import type { Medicine } from '../../../medicines/types/medicine';

function buildMedicine(overrides: Partial<Medicine> = {}): Medicine {
  return {
    id: 'm1',
    name: 'Paracetamol',
    type: 'tablet',
    startDate: '2026-08-01',
    quantity: 30,
    quantityUnit: 'tablet',
    tabletsPerStrip: 10,
    numberOfStrips: 3,
    dosage: { morning: { quantity: 1, unit: 'tablet' } },
    notificationSettings: {
      finishMedicine: { enabled: true, daysBefore: 3, channels: ['push'] },
      expiryMedicine: { enabled: true, daysBefore: 7, channels: ['push'] },
    },
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

const asOf = (isoDate: string, hour = 0) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y as number, (m as number) - 1, d as number, hour);
};

describe('notificationIdentifier / allNotificationIdentifiers', () => {
  it('is deterministic and distinct per medicine and type', () => {
    expect(notificationIdentifier('m1', 'MEDICINE_FINISHING')).toBe('medicine-m1-finishing');
    expect(notificationIdentifier('m1', 'MEDICINE_EXPIRING')).toBe('medicine-m1-expiring');
    expect(notificationIdentifier('m1', 'MEDICINE_FINISHING')).not.toBe(
      notificationIdentifier('m2', 'MEDICINE_FINISHING')
    );
  });

  it('lists both identifiers for a medicine', () => {
    expect(allNotificationIdentifiers('m1')).toEqual(['medicine-m1-finishing', 'medicine-m1-expiring']);
  });
});

describe('computeNotificationPlan', () => {
  it('plans a finishing notification 3 days before the estimated finish date', () => {
    // 30 @ 1/day from 1 Aug finishes 30 Aug; 3 days before = 27 Aug, 9am.
    const medicine = buildMedicine();
    const plan = computeNotificationPlan(medicine, asOf('2026-08-01'));

    const finishing = plan.find((item) => item.type === 'MEDICINE_FINISHING');
    expect(finishing).toBeDefined();
    expect(finishing?.triggerDate).toEqual(new Date(2026, 7, 27, 9, 0, 0));
    expect(finishing?.identifier).toBe('medicine-m1-finishing');
  });

  it('omits the finishing notification when that reminder is disabled', () => {
    const medicine = buildMedicine({
      notificationSettings: {
        finishMedicine: { enabled: false, daysBefore: 3, channels: ['push'] },
        expiryMedicine: { enabled: true, daysBefore: 7, channels: ['push'] },
      },
    });
    const plan = computeNotificationPlan(medicine, asOf('2026-08-01'));
    expect(plan.some((item) => item.type === 'MEDICINE_FINISHING')).toBe(false);
  });

  it('omits the finishing notification when there is no dosage to project a finish date from (invalid dosage)', () => {
    const medicine = buildMedicine({ dosage: undefined });
    const plan = computeNotificationPlan(medicine, asOf('2026-08-01'));
    expect(plan.some((item) => item.type === 'MEDICINE_FINISHING')).toBe(false);
  });

  it('plans an expiry notification 7 days before the expiry date', () => {
    const medicine = buildMedicine({ expiryDate: '2026-09-30' });
    const plan = computeNotificationPlan(medicine, asOf('2026-08-01'));

    const expiring = plan.find((item) => item.type === 'MEDICINE_EXPIRING');
    expect(expiring).toBeDefined();
    expect(expiring?.triggerDate).toEqual(new Date(2026, 8, 23, 9, 0, 0));
  });

  it('normalizes a month-only expiry date before computing the notification date', () => {
    // "2026-09" -> last day 2026-09-30 -> 7 days before -> 2026-09-23.
    const medicine = buildMedicine({ expiryDate: '2026-09' });
    const plan = computeNotificationPlan(medicine, asOf('2026-08-01'));

    const expiring = plan.find((item) => item.type === 'MEDICINE_EXPIRING');
    expect(expiring?.triggerDate).toEqual(new Date(2026, 8, 23, 9, 0, 0));
  });

  it('omits the expiry notification when there is no expiry date (missing expiry date)', () => {
    const medicine = buildMedicine({ expiryDate: undefined });
    const plan = computeNotificationPlan(medicine, asOf('2026-08-01'));
    expect(plan.some((item) => item.type === 'MEDICINE_EXPIRING')).toBe(false);
  });

  it('omits the expiry notification when that reminder is disabled', () => {
    const medicine = buildMedicine({
      expiryDate: '2026-09-30',
      notificationSettings: {
        finishMedicine: { enabled: true, daysBefore: 3, channels: ['push'] },
        expiryMedicine: { enabled: false, daysBefore: 7, channels: ['push'] },
      },
    });
    const plan = computeNotificationPlan(medicine, asOf('2026-08-01'));
    expect(plan.some((item) => item.type === 'MEDICINE_EXPIRING')).toBe(false);
  });

  it('plans both notifications together when both reminders apply', () => {
    const medicine = buildMedicine({ expiryDate: '2026-09-30' });
    const plan = computeNotificationPlan(medicine, asOf('2026-08-01'));
    expect(plan.map((item) => item.type).sort()).toEqual(['MEDICINE_EXPIRING', 'MEDICINE_FINISHING']);
  });

  it('excludes a notification whose date has already passed (notification date in the past)', () => {
    // Finishes 30 Aug, notify 3 days before = 27 Aug — but "now" is 28 Aug.
    const medicine = buildMedicine();
    const plan = computeNotificationPlan(medicine, asOf('2026-08-28'));
    expect(plan.some((item) => item.type === 'MEDICINE_FINISHING')).toBe(false);
  });

  it('excludes a notification for later today once its 9am trigger has already passed', () => {
    const medicine = buildMedicine();
    // Trigger is 27 Aug 09:00; "now" is 27 Aug 10:00.
    const plan = computeNotificationPlan(medicine, asOf('2026-08-27', 10));
    expect(plan.some((item) => item.type === 'MEDICINE_FINISHING')).toBe(false);
  });

  it('includes a notification for later today when its 9am trigger has not passed yet', () => {
    const medicine = buildMedicine();
    const plan = computeNotificationPlan(medicine, asOf('2026-08-27', 7));
    expect(plan.some((item) => item.type === 'MEDICINE_FINISHING')).toBe(true);
  });

  it('returns an empty plan when both reminders are disabled', () => {
    const medicine = buildMedicine({
      expiryDate: '2026-09-30',
      notificationSettings: {
        finishMedicine: { enabled: false, daysBefore: 3, channels: ['push'] },
        expiryMedicine: { enabled: false, daysBefore: 7, channels: ['push'] },
      },
    });
    expect(computeNotificationPlan(medicine, asOf('2026-08-01'))).toEqual([]);
  });
});
