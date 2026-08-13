import {
  emptyPatientFormValues,
  normalizePatientFormValues,
  patientFormSchema,
} from '../patientForm';

describe('patientFormSchema', () => {
  it('accepts a valid name and phone number', () => {
    const result = patientFormSchema.safeParse({ name: 'Father', phoneNumber: '+919876543210' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = patientFormSchema.safeParse({ name: '  ', phoneNumber: '+919876543210' });
    expect(result.success).toBe(false);
  });

  it('rejects a name over the maximum length', () => {
    const result = patientFormSchema.safeParse({
      name: 'a'.repeat(61),
      phoneNumber: '+919876543210',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty phone number', () => {
    const result = patientFormSchema.safeParse({ name: 'Father', phoneNumber: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid phone number', () => {
    const result = patientFormSchema.safeParse({ name: 'Father', phoneNumber: 'not-a-phone' });
    expect(result.success).toBe(false);
  });

  it('accepts a phone number missing its leading +', () => {
    const result = patientFormSchema.safeParse({ name: 'Father', phoneNumber: '919876543210' });
    expect(result.success).toBe(true);
  });
});

describe('normalizePatientFormValues', () => {
  it('trims the name and normalizes the phone number', () => {
    const result = normalizePatientFormValues({
      name: '  Father  ',
      phoneNumber: '91 98765 43210',
    });
    expect(result).toEqual({ name: 'Father', phoneNumber: '+919876543210' });
  });
});

describe('emptyPatientFormValues', () => {
  it('is blank', () => {
    expect(emptyPatientFormValues()).toEqual({ name: '', phoneNumber: '' });
  });
});
