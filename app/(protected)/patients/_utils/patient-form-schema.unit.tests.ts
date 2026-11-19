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
  phone: '501234567',
  phoneCountry: 'AE',
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

const alternatePhoneErrorsOf = (alternatePhoneCountry: string, alternatePhone: string) =>
  patientFormSchema
    .safeParse({ ...createValues, alternatePhoneCountry, alternatePhone })
    .error?.issues.filter((issue) => issue.path[0] === 'alternatePhone')
    .map((issue) => issue.message) ?? [];

const phoneErrorsOf = (phoneCountry: string, phone: string) =>
  patientFormSchema
    .safeParse({ ...createValues, phoneCountry, phone })
    .error?.issues.filter((issue) => issue.path[0] === 'phone')
    .map((issue) => issue.message) ?? [];

describe('Patient form schema', () => {
  it('should default the phone country code to UAE', () => {
    expect(EMPTY_PATIENT_FORM_VALUES.phoneCountry).toBe('AE');
  });

  it('should accept a phone that matches the selected country', () => {
    expect(phoneErrorsOf('AE', '501234567')).toEqual([]);
    expect(phoneErrorsOf('IN', '9876543210')).toEqual([]);
  });

  it('should reject a phone that breaks the UAE numbering rule', () => {
    expect(phoneErrorsOf('AE', '9876543210')).toEqual([
      'Phone must be a 9-digit UAE mobile number starting with 5, or an 8-digit landline number.',
    ]);
  });

  it('should reject a phone with the wrong length for the selected country', () => {
    expect(phoneErrorsOf('IN', '501234567')).toEqual(['Phone must be 10 digits for India (+91).']);
  });

  it('should only report the required message for an empty phone', () => {
    expect(phoneErrorsOf('IN', '')).toEqual(['Phone is required.']);
  });

  it('should default the alternate and Next of Kin phone country codes to UAE', () => {
    expect(EMPTY_PATIENT_FORM_VALUES.alternatePhoneCountry).toBe('AE');
    expect(EMPTY_PATIENT_FORM_VALUES.emergencyContactPhoneCountry).toBe('AE');
  });

  it('should accept an alternate phone that matches its selected country', () => {
    expect(alternatePhoneErrorsOf('AE', '501234567')).toEqual([]);
    expect(alternatePhoneErrorsOf('IN', '9876543210')).toEqual([]);
  });

  it('should accept an empty alternate phone', () => {
    expect(alternatePhoneErrorsOf('IN', '')).toEqual([]);
  });

  it('should reject an alternate phone with the wrong length for its selected country', () => {
    expect(alternatePhoneErrorsOf('IN', '501234567')).toEqual([
      'Alternate phone must be 10 digits for India (+91).',
    ]);
  });

  it('should reject an alternate phone containing non-digit characters', () => {
    for (const alternatePhone of ['sadhfoiaeifjvo', '+971501234567', '050-123-4567']) {
      expect(alternatePhoneErrorsOf('AE', alternatePhone)).toEqual([
        'Alternate phone must contain only digits.',
      ]);
    }
  });

  it('should validate the Next of Kin phone against its own country, not the Phone country', () => {
    const values = {
      ...createValues,
      phoneCountry: 'AE',
      emergencyContactPhoneCountry: 'IN',
      emergencyContactPhone: '501234567',
    };

    expect(errorsOf(values)).toEqual(['Next of Kin Phone must be 10 digits for India (+91).']);
    expect(errorsOf({ ...values, emergencyContactPhone: '9876543210' })).toEqual([]);
  });

  it('should accept an empty Next of Kin phone', () => {
    expect(errorsOf({ ...createValues, emergencyContactPhone: '' })).toEqual([]);
  });

  it('should reject a Next of Kin phone containing non-digit characters', () => {
    expect(errorsOf({ ...createValues, emergencyContactPhone: '747920843idjcksdno' })).toEqual([
      'Next of Kin Phone must contain only digits.',
    ]);
  });

  it('should reject an empty title for create values', () => {
    expect(errorsOf({ ...createValues, title: '' })).toContain('Title is required.');
  });

  it('should reject an empty title for edit values', () => {
    expect(errorsOf({ ...editValues, title: '' })).toContain('Title is required.');
  });
});
