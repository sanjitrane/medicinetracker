import { z } from 'zod';

import { isValidPhoneNumber, normalizePhoneNumber } from '@/features/auth/utils/phoneNumber';

/** phase2_architecture.md #10: "Reasonable maximum length" for a patient name. */
const MAX_NAME_LENGTH = 60;

export const patientFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(MAX_NAME_LENGTH, 'Name is too long'),
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Enter a phone number')
    .refine(isValidPhoneNumber, 'Enter a valid phone number, including country code'),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export function emptyPatientFormValues(): PatientFormValues {
  return { name: '', phoneNumber: '' };
}

/** Applied after validation, at submit time — trims the name and normalizes the phone number. */
export function normalizePatientFormValues(values: PatientFormValues): PatientFormValues {
  return { name: values.name.trim(), phoneNumber: normalizePhoneNumber(values.phoneNumber) };
}
