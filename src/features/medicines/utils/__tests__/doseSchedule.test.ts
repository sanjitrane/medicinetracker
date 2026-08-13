import {
  buildTodaysDoseItems,
  DOSE_SLOT_ORDER,
  formatSlotWindow,
  getDoseTimingStatus,
} from '../doseSchedule';
import type { DoseConfirmation } from '../../types/doseConfirmation';
import type { Medicine } from '../../types/medicine';

function buildMedicine(overrides: Partial<Medicine> = {}): Medicine {
  return {
    id: 'm1',
    patientId: 'p1',
    name: 'Paracetamol',
    type: 'tablet',
    startDate: '2026-08-01',
    quantity: 90,
    quantityUnit: 'tablet',
    tabletsPerStrip: 10,
    numberOfStrips: 9,
    dosage: {
      morning: { quantity: 1, unit: 'tablet' },
      afternoon: { quantity: 1, unit: 'tablet' },
    },
    notificationSettings: {
      finishMedicine: { enabled: true, daysBefore: 3, channels: ['push'] },
      expiryMedicine: { enabled: true, daysBefore: 7, channels: ['push'] },
    },
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function at(hour: number): Date {
  return new Date(2026, 7, 12, hour, 0, 0);
}

describe('DOSE_SLOT_ORDER', () => {
  it('is chronological', () => {
    expect(DOSE_SLOT_ORDER).toEqual(['morning', 'afternoon', 'evening']);
  });
});

describe('formatSlotWindow', () => {
  it('formats each window in 12-hour time', () => {
    expect(formatSlotWindow('morning')).toBe('Morning · 6 AM–11 AM');
    expect(formatSlotWindow('afternoon')).toBe('Afternoon · 12 PM–3 PM');
    expect(formatSlotWindow('evening')).toBe('Evening · 8 PM–11 PM');
  });
});

describe('getDoseTimingStatus', () => {
  it('is "done" once confirmed, regardless of time', () => {
    expect(getDoseTimingStatus('morning', true, at(3))).toBe('done');
    expect(getDoseTimingStatus('morning', true, at(23))).toBe('done');
  });

  it('is "upcoming" before the window opens', () => {
    expect(getDoseTimingStatus('morning', false, at(5))).toBe('upcoming');
  });

  it('is "due" inside the window', () => {
    expect(getDoseTimingStatus('morning', false, at(6))).toBe('due');
    expect(getDoseTimingStatus('morning', false, at(11))).toBe('due');
  });

  it('is "overdue" once the window has fully passed, unconfirmed', () => {
    expect(getDoseTimingStatus('morning', false, at(12))).toBe('overdue');
  });

  it('treats the gap between windows as upcoming for the next slot', () => {
    // 4pm: afternoon (12-3pm) has passed, evening (8-11pm) has not started.
    expect(getDoseTimingStatus('evening', false, at(16))).toBe('upcoming');
    expect(getDoseTimingStatus('afternoon', false, at(16))).toBe('overdue');
  });
});

describe('buildTodaysDoseItems', () => {
  it('produces one entry per scheduled slot for a medicine due twice a day', () => {
    const medicine = buildMedicine();
    const items = buildTodaysDoseItems([medicine], [], at(7));

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.slot)).toEqual(['morning', 'afternoon']);
  });

  it('sorts entries by time of day across multiple medicines', () => {
    const morningOnly = buildMedicine({
      id: 'm2',
      name: 'Zinc',
      dosage: { morning: { quantity: 1, unit: 'tablet' } },
    });
    const eveningOnly = buildMedicine({
      id: 'm3',
      name: 'Aspirin',
      dosage: { evening: { quantity: 1, unit: 'tablet' } },
    });
    const items = buildTodaysDoseItems([eveningOnly, morningOnly], [], at(7));

    expect(items.map((item) => item.slot)).toEqual(['morning', 'evening']);
  });

  it('sorts alphabetically by medicine name within the same slot', () => {
    const a = buildMedicine({
      id: 'm-a',
      name: 'Zinc',
      dosage: { morning: { quantity: 1, unit: 'tablet' } },
    });
    const b = buildMedicine({
      id: 'm-b',
      name: 'Amoxicillin',
      dosage: { morning: { quantity: 1, unit: 'tablet' } },
    });
    const items = buildTodaysDoseItems([a, b], [], at(7));

    expect(items.map((item) => item.medicineName)).toEqual(['Amoxicillin', 'Zinc']);
  });

  it('marks a slot confirmed only from a matching confirmation for today', () => {
    const medicine = buildMedicine();
    const confirmations: DoseConfirmation[] = [
      {
        id: 'c1',
        medicineId: medicine.id,
        date: '2026-08-12',
        slot: 'morning',
        confirmedAt: '2026-08-12T07:00:00.000Z',
      },
    ];
    const items = buildTodaysDoseItems([medicine], confirmations, at(7));

    const morning = items.find((item) => item.slot === 'morning');
    const afternoon = items.find((item) => item.slot === 'afternoon');
    expect(morning?.isConfirmed).toBe(true);
    expect(afternoon?.isConfirmed).toBe(false);
  });

  it('ignores a confirmation logged for a different date', () => {
    const medicine = buildMedicine();
    const confirmations: DoseConfirmation[] = [
      {
        id: 'c1',
        medicineId: medicine.id,
        date: '2026-08-11',
        slot: 'morning',
        confirmedAt: '2026-08-11T07:00:00.000Z',
      },
    ];
    const items = buildTodaysDoseItems([medicine], confirmations, at(7));
    expect(items.find((item) => item.slot === 'morning')?.isConfirmed).toBe(false);
  });

  it('excludes a medicine with no dosage schedule', () => {
    const medicine = buildMedicine({ dosage: undefined });
    expect(buildTodaysDoseItems([medicine], [], at(7))).toHaveLength(0);
  });

  it('excludes a medicine that has not started yet', () => {
    const medicine = buildMedicine({ startDate: '2026-08-20' });
    expect(buildTodaysDoseItems([medicine], [], at(7))).toHaveLength(0);
  });

  it('excludes a FINISHED medicine', () => {
    const medicine = buildMedicine({
      quantity: 2,
      startDate: '2026-01-01',
      dosage: { morning: { quantity: 1, unit: 'tablet' } },
    });
    expect(buildTodaysDoseItems([medicine], [], at(7))).toHaveLength(0);
  });

  it('excludes an EXPIRED medicine', () => {
    const medicine = buildMedicine({ expiryDate: '2026-01-01' });
    expect(buildTodaysDoseItems([medicine], [], at(7))).toHaveLength(0);
  });

  it('includes a medicine that is FINISHING_SOON or EXPIRING_SOON', () => {
    const finishingSoon = buildMedicine({
      id: 'm-fs',
      quantity: 4,
      startDate: '2026-08-10',
      dosage: { morning: { quantity: 1, unit: 'tablet' } },
      notificationSettings: {
        finishMedicine: { enabled: true, daysBefore: 3, channels: ['push'] },
        expiryMedicine: { enabled: true, daysBefore: 7, channels: ['push'] },
      },
    });
    expect(buildTodaysDoseItems([finishingSoon], [], at(7))).toHaveLength(1);
  });
});
