import { describe, expect, it } from 'vitest';

import {
  createPatientSchema,
  patientIdSchema,
  patientTenantIdSchema,
  updatePatientSchema,
} from './patient-schema';

const errorsOf = (result: ReturnType<typeof createPatientSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

const validPayload = {
  firstName: 'Asha',
  lastName: 'Rao',
  gender: 'female',
  dateOfBirth: '1990-05-14',
  phone: '9876543210',
};

describe('Patient schema', () => {
  it('should require first name, last name, gender, date of birth and phone', () => {
    const errors = errorsOf(createPatientSchema.safeParse({}));
    expect(errors).toEqual(
      expect.arrayContaining([
        'Patient first name is required',
        'Patient last name is required',
        'Patient gender is invalid',
        'Date of birth is required',
        'Patient phone is required',
      ])
    );
  });

  it('should reject an invalid gender', () => {
    expect(errorsOf(createPatientSchema.safeParse({ ...validPayload, gender: 'robot' }))).toContain(
      'Patient gender is invalid'
    );
  });

  it('should reject an invalid blood group', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, bloodGroup: 'Z+' }))
    ).toContain('Patient blood group is invalid');
  });

  it('should reject an invalid marital status', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, maritalStatus: 'engaged' }))
    ).toContain('Patient marital status is invalid');
  });

  it('should reject an invalid preferred payment method', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, preferredPaymentMethod: 'crypto' }))
    ).toContain('Patient preferred payment method is invalid');
  });

  it('should accept each supported preferred payment method', () => {
    for (const method of ['cash', 'insurance', 'self-pay', 'corporate']) {
      const result = createPatientSchema.safeParse({
        ...validPayload,
        preferredPaymentMethod: method,
      });
      expect(result.success).toBe(true);
      expect(result.data?.preferredPaymentMethod).toBe(method);
    }
  });

  it('should treat a blank preferred payment method as omitted', () => {
    const result = createPatientSchema.safeParse({ ...validPayload, preferredPaymentMethod: '  ' });
    expect(result.success).toBe(true);
    expect(result.data?.preferredPaymentMethod).toBeUndefined();
  });

  it('should reject a future date of birth', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, dateOfBirth: '3000-01-01' }))
    ).toContain('Date of birth must not be in the future');
  });

  it("should accept today's date of birth", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(createPatientSchema.safeParse({ ...validPayload, dateOfBirth: today }).success).toBe(
      true
    );
  });

  it('should reject a malformed date of birth', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, dateOfBirth: '14-05-1990' }))
    ).toContain('Date of birth must be a valid date');
  });

  it('should reject an invalid email', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, email: 'not-an-email' }))
    ).toContain('Patient email must be valid');
  });

  it('should require government ID number when government ID type is provided', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, govtIdType: 'passport' }))
    ).toContain('Patient government ID type and number must be provided together');
  });

  it('should require government ID type when government ID number is provided', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, govtIdNumber: 'X1234567' }))
    ).toContain('Patient government ID type and number must be provided together');
  });

  it('should accept government ID type and number provided together', () => {
    expect(
      createPatientSchema.safeParse({
        ...validPayload,
        govtIdType: 'passport',
        govtIdNumber: 'X1234567',
      }).success
    ).toBe(true);
  });

  it('should reject an invalid government ID type', () => {
    expect(
      errorsOf(
        createPatientSchema.safeParse({
          ...validPayload,
          govtIdType: 'social-security',
          govtIdNumber: '123',
        })
      )
    ).toContain('Patient government ID type is invalid');
  });

  it('should require country ID when state ID is provided', () => {
    expect(errorsOf(createPatientSchema.safeParse({ ...validPayload, stateId: 1 }))).toContain(
      'Patient country ID is required when state ID is provided'
    );
  });

  it('should accept state ID together with country ID', () => {
    expect(
      createPatientSchema.safeParse({ ...validPayload, stateId: 1, countryId: 1 }).success
    ).toBe(true);
  });

  it('should accept a valid create payload and drop blank optionals', () => {
    const result = createPatientSchema.safeParse({ ...validPayload, middleName: '   ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.middleName).toBeUndefined();
    }
  });

  it('should apply the same rules to update payloads', () => {
    expect(updatePatientSchema.safeParse({}).success).toBe(false);
    expect(updatePatientSchema.safeParse(validPayload).success).toBe(true);
  });

  it('should validate the patient id and tenant id', () => {
    expect(patientIdSchema.safeParse('1').success).toBe(true);
    expect(patientIdSchema.safeParse('0').success).toBe(false);
    expect(patientTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
