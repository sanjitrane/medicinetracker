import type { Medicine } from '@/features/medicines/types/medicine';

import {
  allDoseReminderIdentifiers,
  computeDoseReminderPlan,
  doseReminderIdentifier,
} from '../doseReminderPlanner';

const PATIENT_NAME = 'Father';

function buildMedicine(overrides: Partial<Medicine> = {}): Medicine {
  return {
    id: 'm1',
    patientId: 'p1',
    name: 'Paracetamol',
    type: 'tablet',
    startDate: '2026-08-01',
    quantity: 30,
    quantityUnit: 'tablet',
    tabletsPerStrip: 10,
    numberOfStrips: 3,
    dosage: { morning: { quantity: 1, unit: 'tablet', time: '08:00' } },
    notificationSettings: {
      finishMedicine: { enabled: true, daysBefore: 3, channels: ['push'] },
      expiryMedicine: { enabled: true, daysBefore: 7, channels: ['push'] },
    },
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('doseReminderIdentifier / allDoseReminderIdentifiers', () => {
  it('is deterministic and distinct per medicine and slot', () => {
    expect(doseReminderIdentifier('m1', 'morning')).toBe('medicine-m1-dose-morning');
    expect(doseReminderIdentifier('m1', 'morning')).not.toBe(doseReminderIdentifier('m2', 'morning'));
    expect(doseReminderIdentifier('m1', 'morning')).not.toBe(doseReminderIdentifier('m1', 'evening'));
  });

  it('lists one identifier per dose slot', () => {
    expect(allDoseReminderIdentifiers('m1')).toEqual([
      'medicine-m1-dose-morning',
      'medicine-m1-dose-afternoon',
      'medicine-m1-dose-evening',
    ]);
  });
});

describe('computeDoseReminderPlan', () => {
  it('plans a daily reminder for a slot with a quantity and a time set', () => {
    const medicine = buildMedicine();
    const plan = computeDoseReminderPlan(medicine, PATIENT_NAME);

    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({
      identifier: 'medicine-m1-dose-morning',
      slot: 'morning',
      hour: 8,
      minute: 0,
    });
  });

  it('includes the patient name and medicine name in the title', () => {
    const medicine = buildMedicine();
    const plan = computeDoseReminderPlan(medicine, PATIENT_NAME);
    expect(plan[0]?.title).toBe('Father: time for Paracetamol');
  });

  it('omits a slot with no time set', () => {
    const medicine = buildMedicine({
      dosage: { morning: { quantity: 1, unit: 'tablet' } },
    });
    expect(computeDoseReminderPlan(medicine, PATIENT_NAME)).toEqual([]);
  });

  it('omits a slot with a zero quantity even if a time is set', () => {
    const medicine = buildMedicine({
      dosage: { morning: { quantity: 0, unit: 'tablet', time: '08:00' } },
    });
    expect(computeDoseReminderPlan(medicine, PATIENT_NAME)).toEqual([]);
  });

  it('omits a slot with a malformed time string', () => {
    const medicine = buildMedicine({
      dosage: { morning: { quantity: 1, unit: 'tablet', time: 'not-a-time' } },
    });
    expect(computeDoseReminderPlan(medicine, PATIENT_NAME)).toEqual([]);
  });

  it('returns an empty plan when the medicine has no dosage schedule at all', () => {
    const medicine = buildMedicine({ dosage: undefined });
    expect(computeDoseReminderPlan(medicine, PATIENT_NAME)).toEqual([]);
  });

  it('plans one reminder per slot that has both a quantity and a time', () => {
    const medicine = buildMedicine({
      dosage: {
        morning: { quantity: 1, unit: 'tablet', time: '08:00' },
        afternoon: { quantity: 1, unit: 'tablet' },
        evening: { quantity: 2, unit: 'tablet', time: '21:30' },
      },
    });
    const plan = computeDoseReminderPlan(medicine, PATIENT_NAME);
    expect(plan.map((item) => item.slot)).toEqual(['morning', 'evening']);
    expect(plan.find((item) => item.slot === 'evening')).toMatchObject({ hour: 21, minute: 30 });
  });
});
