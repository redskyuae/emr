import { describe, expect, it } from 'vitest';

import { patientFormSchema } from './patient-form-schema';
import { EMPTY_PATIENT_FORM_VALUES } from './patient-form-values';

const validValues = {
  ...EMPTY_PATIENT_FORM_VALUES,
  firstName: 'Asha',
  lastName: 'Rao',
  gender: 'female' as const,
  dateOfBirth: '1990-05-14',
  phone: '0501234567',
};

const alternatePhoneErrorsOf = (alternatePhone: string) =>
  patientFormSchema
    .safeParse({ ...validValues, alternatePhone })
    .error?.issues.filter((issue) => issue.path[0] === 'alternatePhone')
    .map((issue) => issue.message) ?? [];

describe('Patient form schema', () => {
  it('should accept a digits-only alternate phone', () => {
    expect(
      patientFormSchema.safeParse({ ...validValues, alternatePhone: '0501234567' }).success
    ).toBe(true);
  });

  it('should accept an empty alternate phone', () => {
    expect(patientFormSchema.safeParse({ ...validValues, alternatePhone: '' }).success).toBe(true);
  });

  it('should reject an alternate phone containing letters', () => {
    expect(alternatePhoneErrorsOf('sadhfoiaeifjvo')).toEqual([
      'Alternate phone must contain only digits.',
    ]);
  });

  it('should reject an alternate phone containing special characters', () => {
    for (const alternatePhone of ['+971501234567', '050-123-4567', '050 123 4567']) {
      expect(alternatePhoneErrorsOf(alternatePhone)).toEqual([
        'Alternate phone must contain only digits.',
      ]);
    }
  });
});
