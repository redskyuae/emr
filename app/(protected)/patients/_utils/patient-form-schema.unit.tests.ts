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

describe('patientFormSchema', () => {
  it('should reject an empty title for create values', () => {
    expect(errorsOf({ ...createValues, title: '' })).toContain('Title is required.');
  });

  it('should reject an empty title for edit values', () => {
    expect(errorsOf({ ...editValues, title: '' })).toContain('Title is required.');
  });
});
