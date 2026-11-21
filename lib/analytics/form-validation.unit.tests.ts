import type { FieldErrors } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { formValidationFailure } from './form-validation';

type PatientLike = {
  firstName: string;
  phone: string;
  emiratesId: string;
  identityDocuments: { number: string }[];
};

describe('formValidationFailure', () => {
  it('should send the names of the invalid fields and how many, never values or messages', () => {
    const errors: FieldErrors<PatientLike> = {
      phone: { type: 'custom', message: 'Phone +971 50 123 4567 is invalid' },
      firstName: { type: 'too_small', message: 'First name is required' },
    };

    const failure = formValidationFailure('patient_registration', errors);

    expect(failure).toEqual({
      form: 'patient_registration',
      invalid_field_count: 2,
      invalid_fields: ['firstName', 'phone'],
    });
    expect(JSON.stringify(failure)).not.toMatch(/971|required/);
  });

  it('should count a field array once under its own name and skip form-level errors', () => {
    const errors = {
      identityDocuments: [{ number: { type: 'too_small', message: 'Number is required' } }],
      root: { type: 'server', message: 'Emirates ID 784-1990-1234567-1 already exists' },
    } as FieldErrors<PatientLike>;

    expect(formValidationFailure('patient_edit', errors)).toEqual({
      form: 'patient_edit',
      invalid_field_count: 1,
      invalid_fields: ['identityDocuments'],
    });
  });
});
