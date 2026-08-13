import { z } from 'zod';

import { today } from '@/utils/dateUtils';

import type { MedicineInput } from '../store/medicineStore';
import type { DosageSchedule, Dose, Medicine, QuantityUnit } from '../types/medicine';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH_OR_DATE = /^\d{4}-\d{2}(-\d{2})?$/;

/**
 * The subset of form fields a scan can pre-fill (architecture.md #17) — kept
 * here rather than in the scanner feature so `MedicineForm` never has to
 * depend on `features/scanner`; the scanner depends on medicines, not the
 * other way round.
 */
export type UncertainFormField = 'name' | 'manufacturingDate' | 'expiryDate';

function isPositiveNumber(raw: string): boolean {
  const value = Number(raw);
  return raw.trim() !== '' && !Number.isNaN(value) && value > 0;
}

/**
 * Form values are strings even for numeric fields — that is what RN
 * `TextInput` produces, and coercing at the schema boundary (rather than
 * fighting react-hook-form for numeric controlled inputs) keeps the form
 * itself simple. Numbers are only real once mapped to a `MedicineInput`.
 */
export const medicineFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter a medicine name'),
    type: z.enum(['tablet', 'syrup']),

    manufacturingDate: z
      .string()
      .trim()
      .refine((value) => value === '' || ISO_MONTH_OR_DATE.test(value), 'Use YYYY-MM-DD'),
    expiryDate: z
      .string()
      .trim()
      .refine((value) => value === '' || ISO_MONTH_OR_DATE.test(value), 'Use YYYY-MM-DD'),
    startDate: z
      .string()
      .trim()
      .refine((value) => ISO_DATE.test(value), 'Use YYYY-MM-DD'),

    tabletsPerStrip: z.string().trim(),
    numberOfStrips: z.string().trim(),
    bottleQuantityMl: z.string().trim(),

    morningQuantity: z.string().trim(),
    afternoonQuantity: z.string().trim(),
    eveningQuantity: z.string().trim(),

    finishReminderEnabled: z.boolean(),
    finishReminderDays: z.string().trim(),
    expiryReminderEnabled: z.boolean(),
    expiryReminderDays: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    if (values.type === 'tablet') {
      if (!isPositiveNumber(values.tabletsPerStrip)) {
        ctx.addIssue({
          code: 'custom',
          path: ['tabletsPerStrip'],
          message: 'Enter tablets per strip',
        });
      }
      if (!isPositiveNumber(values.numberOfStrips)) {
        ctx.addIssue({ code: 'custom', path: ['numberOfStrips'], message: 'Enter number of strips' });
      }
    } else if (!isPositiveNumber(values.bottleQuantityMl)) {
      ctx.addIssue({ code: 'custom', path: ['bottleQuantityMl'], message: 'Enter bottle size in ml' });
    }

    (['morningQuantity', 'afternoonQuantity', 'eveningQuantity'] as const).forEach((field) => {
      const raw = values[field].trim();
      if (raw !== '' && (Number.isNaN(Number(raw)) || Number(raw) < 0)) {
        ctx.addIssue({ code: 'custom', path: [field], message: 'Must be a positive number' });
      }
    });

    if (values.finishReminderEnabled && !isPositiveNumber(values.finishReminderDays)) {
      ctx.addIssue({ code: 'custom', path: ['finishReminderDays'], message: 'Enter days before' });
    }
    if (values.expiryReminderEnabled && !isPositiveNumber(values.expiryReminderDays)) {
      ctx.addIssue({ code: 'custom', path: ['expiryReminderDays'], message: 'Enter days before' });
    }
  });

export type MedicineFormValues = z.infer<typeof medicineFormSchema>;

export function emptyMedicineFormValues(): MedicineFormValues {
  return {
    name: '',
    type: 'tablet',
    manufacturingDate: '',
    expiryDate: '',
    startDate: today(),
    tabletsPerStrip: '',
    numberOfStrips: '',
    bottleQuantityMl: '',
    morningQuantity: '',
    afternoonQuantity: '',
    eveningQuantity: '',
    finishReminderEnabled: true,
    finishReminderDays: '3',
    expiryReminderEnabled: true,
    expiryReminderDays: '7',
  };
}

export function medicineToFormValues(medicine: Medicine): MedicineFormValues {
  return {
    name: medicine.name,
    type: medicine.type,
    manufacturingDate: medicine.manufacturingDate ?? '',
    expiryDate: medicine.expiryDate ?? '',
    startDate: medicine.startDate,
    tabletsPerStrip: medicine.tabletsPerStrip?.toString() ?? '',
    numberOfStrips: medicine.numberOfStrips?.toString() ?? '',
    bottleQuantityMl: medicine.bottleQuantityMl?.toString() ?? '',
    morningQuantity: medicine.dosage?.morning?.quantity.toString() ?? '',
    afternoonQuantity: medicine.dosage?.afternoon?.quantity.toString() ?? '',
    eveningQuantity: medicine.dosage?.evening?.quantity.toString() ?? '',
    finishReminderEnabled: medicine.notificationSettings.finishMedicine.enabled,
    finishReminderDays: medicine.notificationSettings.finishMedicine.daysBefore.toString(),
    expiryReminderEnabled: medicine.notificationSettings.expiryMedicine.enabled,
    expiryReminderDays: medicine.notificationSettings.expiryMedicine.daysBefore.toString(),
  };
}

function buildDose(raw: string, unit: QuantityUnit): Dose | undefined {
  const quantity = Number(raw.trim());
  return raw.trim() !== '' && quantity > 0 ? { quantity, unit } : undefined;
}

/**
 * Deliberately does not produce `patientId` — the form never collects it.
 * The caller (the manual-entry screen) fills it in from whichever patient
 * is selected, or from the medicine being edited, before saving.
 */
export function formValuesToMedicineInput(
  values: MedicineFormValues
): Omit<MedicineInput, 'patientId'> {
  const quantityUnit: QuantityUnit = values.type === 'tablet' ? 'tablet' : 'ml';

  const quantity =
    values.type === 'tablet'
      ? Number(values.tabletsPerStrip) * Number(values.numberOfStrips)
      : Number(values.bottleQuantityMl);

  const dosage: DosageSchedule = {
    morning: buildDose(values.morningQuantity, quantityUnit),
    afternoon: buildDose(values.afternoonQuantity, quantityUnit),
    evening: buildDose(values.eveningQuantity, quantityUnit),
  };
  const hasDosage = Boolean(dosage.morning || dosage.afternoon || dosage.evening);

  return {
    name: values.name.trim(),
    type: values.type,
    manufacturingDate: values.manufacturingDate.trim() || undefined,
    expiryDate: values.expiryDate.trim() || undefined,
    startDate: values.startDate.trim(),
    quantity,
    quantityUnit,
    tabletsPerStrip: values.type === 'tablet' ? Number(values.tabletsPerStrip) : undefined,
    numberOfStrips: values.type === 'tablet' ? Number(values.numberOfStrips) : undefined,
    bottleQuantityMl: values.type === 'syrup' ? Number(values.bottleQuantityMl) : undefined,
    dosage: hasDosage ? dosage : undefined,
    notificationSettings: {
      finishMedicine: {
        enabled: values.finishReminderEnabled,
        daysBefore: Number(values.finishReminderDays) || 0,
        channels: ['push'],
      },
      expiryMedicine: {
        enabled: values.expiryReminderEnabled,
        daysBefore: Number(values.expiryReminderDays) || 0,
        channels: ['push'],
      },
    },
  };
}
