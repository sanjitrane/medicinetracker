import {
  emptyMedicineFormValues,
  formValuesToMedicineInput,
  medicineFormSchema,
  medicineToFormValues,
} from '../medicineForm';
import type { Medicine } from '../../types/medicine';

describe('medicineFormSchema', () => {
  it('rejects an empty name', () => {
    const result = medicineFormSchema.safeParse({
      ...emptyMedicineFormValues(),
      name: '  ',
      tabletsPerStrip: '10',
      numberOfStrips: '2',
    });
    expect(result.success).toBe(false);
  });

  it('requires tablet packaging when type is tablet', () => {
    const result = medicineFormSchema.safeParse({
      ...emptyMedicineFormValues(),
      name: 'Paracetamol',
      type: 'tablet',
      tabletsPerStrip: '',
      numberOfStrips: '',
    });
    expect(result.success).toBe(false);
  });

  it('requires bottle size when type is syrup', () => {
    const result = medicineFormSchema.safeParse({
      ...emptyMedicineFormValues(),
      name: 'Cough Syrup',
      type: 'syrup',
      bottleQuantityMl: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed start date', () => {
    const result = medicineFormSchema.safeParse({
      ...emptyMedicineFormValues(),
      name: 'Paracetamol',
      tabletsPerStrip: '10',
      numberOfStrips: '2',
      startDate: '12-08-2026',
    });
    expect(result.success).toBe(false);
  });

  it('requires a day count when a reminder is enabled', () => {
    const result = medicineFormSchema.safeParse({
      ...emptyMedicineFormValues(),
      name: 'Paracetamol',
      tabletsPerStrip: '10',
      numberOfStrips: '2',
      finishReminderEnabled: true,
      finishReminderDays: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a fully valid tablet form', () => {
    const result = medicineFormSchema.safeParse({
      ...emptyMedicineFormValues(),
      name: 'Paracetamol',
      tabletsPerStrip: '10',
      numberOfStrips: '3',
    });
    expect(result.success).toBe(true);
  });
});

describe('formValuesToMedicineInput', () => {
  it('computes tablet quantity from strips × per-strip', () => {
    const input = formValuesToMedicineInput({
      ...emptyMedicineFormValues(),
      name: 'Paracetamol',
      type: 'tablet',
      tabletsPerStrip: '10',
      numberOfStrips: '3',
    });

    expect(input.quantity).toBe(30);
    expect(input.quantityUnit).toBe('tablet');
    expect(input.tabletsPerStrip).toBe(10);
    expect(input.numberOfStrips).toBe(3);
    expect(input.bottleQuantityMl).toBeUndefined();
  });

  it('uses the bottle size for syrup quantity', () => {
    const input = formValuesToMedicineInput({
      ...emptyMedicineFormValues(),
      name: 'Cough Syrup',
      type: 'syrup',
      bottleQuantityMl: '100',
    });

    expect(input.quantity).toBe(100);
    expect(input.quantityUnit).toBe('ml');
    expect(input.tabletsPerStrip).toBeUndefined();
    expect(input.numberOfStrips).toBeUndefined();
  });

  it('omits dosage entirely when no slot has a quantity', () => {
    const input = formValuesToMedicineInput({
      ...emptyMedicineFormValues(),
      name: 'Paracetamol',
      tabletsPerStrip: '10',
      numberOfStrips: '3',
    });

    expect(input.dosage).toBeUndefined();
  });

  it('builds only the dosage slots that were filled in', () => {
    const input = formValuesToMedicineInput({
      ...emptyMedicineFormValues(),
      name: 'Paracetamol',
      tabletsPerStrip: '10',
      numberOfStrips: '3',
      morningQuantity: '1',
      eveningQuantity: '1',
    });

    expect(input.dosage).toEqual({
      morning: { quantity: 1, unit: 'tablet' },
      afternoon: undefined,
      evening: { quantity: 1, unit: 'tablet' },
    });
  });

  it('maps reminder toggles and lead times into notification settings', () => {
    const input = formValuesToMedicineInput({
      ...emptyMedicineFormValues(),
      name: 'Paracetamol',
      tabletsPerStrip: '10',
      numberOfStrips: '3',
      finishReminderEnabled: true,
      finishReminderDays: '5',
      expiryReminderEnabled: false,
      expiryReminderDays: '7',
    });

    expect(input.notificationSettings).toEqual({
      finishMedicine: { enabled: true, daysBefore: 5, channels: ['push'] },
      expiryMedicine: { enabled: false, daysBefore: 7, channels: ['push'] },
    });
  });
});

describe('medicineToFormValues', () => {
  it('round-trips a stored medicine back into form strings', () => {
    const medicine: Medicine = {
      id: 'm1',
      patientId: 'p1',
      name: 'Paracetamol',
      type: 'tablet',
      startDate: '2026-08-12',
      quantity: 30,
      quantityUnit: 'tablet',
      tabletsPerStrip: 10,
      numberOfStrips: 3,
      dosage: { morning: { quantity: 1, unit: 'tablet' } },
      notificationSettings: {
        finishMedicine: { enabled: true, daysBefore: 3, channels: ['push'] },
        expiryMedicine: { enabled: true, daysBefore: 7, channels: ['push'] },
      },
      createdAt: '2026-08-12T00:00:00.000Z',
      updatedAt: '2026-08-12T00:00:00.000Z',
    };

    const values = medicineToFormValues(medicine);

    expect(values.name).toBe('Paracetamol');
    expect(values.tabletsPerStrip).toBe('10');
    expect(values.numberOfStrips).toBe('3');
    expect(values.morningQuantity).toBe('1');
    expect(values.afternoonQuantity).toBe('');
    expect(values.finishReminderDays).toBe('3');
  });
});
