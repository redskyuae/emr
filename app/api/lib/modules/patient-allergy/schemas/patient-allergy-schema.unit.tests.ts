import { describe, expect, it } from 'vitest';

import {
  createPatientAllergySchema,
  patientAllergyIdSchema,
} from './patient-allergy-schema';

const errorsOf = (result: ReturnType<typeof createPatientAllergySchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('PatientAllergy schema', () => {
  it('should require severity', () => {
    expect(errorsOf(createPatientAllergySchema.safeParse({ substance: 'Peanuts' }))).toContain(
      'Allergy severity is invalid'
    );
  });

  it('should reject invalid severity', () => {
    expect(
      errorsOf(createPatientAllergySchema.safeParse({ substance: 'Peanuts', severity: 'huge' }))
    ).toContain('Allergy severity is invalid');
  });

  it('should require either allergen or substance', () => {
    expect(errorsOf(createPatientAllergySchema.safeParse({ severity: 'mild' }))).toContain(
      'Allergy requires either an allergen or a free-text substance'
    );
  });

  it('should accept an allergenId without substance', () => {
    const result = createPatientAllergySchema.safeParse({ allergenId: 3, severity: 'mild' });
    expect(result.success).toBe(true);
  });

  it('should default status to active', () => {
    const result = createPatientAllergySchema.parse({ substance: 'Peanuts', severity: 'mild' });
    expect(result.status).toBe('active');
  });

  it('should coerce allergenId and reject non-positive', () => {
    expect(
      createPatientAllergySchema.safeParse({ allergenId: '5', severity: 'mild' }).success
    ).toBe(true);
    expect(
      createPatientAllergySchema.safeParse({ allergenId: 0, substance: 'x', severity: 'mild' })
        .success
    ).toBe(false);
  });

  it('should reject an invalid noted-on date', () => {
    expect(
      errorsOf(
        createPatientAllergySchema.safeParse({
          substance: 'Peanuts',
          severity: 'mild',
          notedOn: '2020-13-40',
        })
      )
    ).toContain('Allergy noted-on date must be a valid date');
  });

  it('should validate allergy id is a positive integer', () => {
    expect(patientAllergyIdSchema.safeParse('1').success).toBe(true);
    expect(patientAllergyIdSchema.safeParse('0').success).toBe(false);
  });
});
