import { describe, expect, it } from 'vitest';

import { patientFormSchema, type PatientFormValues } from './patient-form-schema';
import { EMPTY_PATIENT_FORM_VALUES } from './patient-form-values';

const createValues: PatientFormValues = {
  ...EMPTY_PATIENT_FORM_VALUES,
  title: 'mrs',
  firstName: 'Asha',
  lastName: 'Rao',
  gender: 'female',
  dateOfBirth: '1990-05-14',
  phone: '9876543210',
  hasEmiratesId: true,
  emiratesId: '784199012345671',
};

const editValues: PatientFormValues = {
  ...createValues,
  hasEmiratesId: false,
  emiratesId: '000000000000000',
  patientIdentificationCategory: 'national-without-card',
};

const errorsOf = (values: PatientFormValues) =>
  patientFormSchema.safeParse(values).error?.issues.map((issue) => issue.message) ?? [];

const alternatePhoneErrorsOf = (alternatePhone: string) =>
  patientFormSchema
    .safeParse({ ...createValues, alternatePhone })
    .error?.issues.filter((issue) => issue.path[0] === 'alternatePhone')
    .map((issue) => issue.message) ?? [];

describe('Patient form schema', () => {
  it('should accept a digits-only alternate phone', () => {
    expect(
      patientFormSchema.safeParse({ ...createValues, alternatePhone: '0501234567' }).success
    ).toBe(true);
  });

  it('should accept an empty alternate phone', () => {
    expect(patientFormSchema.safeParse({ ...createValues, alternatePhone: '' }).success).toBe(true);
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

  it('should reject an empty title for create values', () => {
    expect(errorsOf({ ...createValues, title: '' })).toContain('Title is required.');
  });

  it('should reject an empty title for edit values', () => {
    expect(errorsOf({ ...editValues, title: '' })).toContain('Title is required.');
  });
});
