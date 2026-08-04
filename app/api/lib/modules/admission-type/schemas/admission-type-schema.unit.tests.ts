import { describe, expect, it } from 'vitest';

import {
  createAdmissionTypeSchema,
  updateAdmissionTypeSchema,
  admissionTypeIdSchema,
  admissionTypeTenantIdSchema,
} from './admission-type-schema';

const errorsOf = (result: ReturnType<typeof createAdmissionTypeSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('AdmissionType schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createAdmissionTypeSchema.safeParse({ code: 'EMER' }))).toContain(
      'Admission type name is required'
    );
  });

  it('should return validation error when code is missing', () => {
    expect(errorsOf(createAdmissionTypeSchema.safeParse({ name: 'Emergency' }))).toContain(
      'Admission type code is required'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(errorsOf(createAdmissionTypeSchema.safeParse({ name: '   ', code: 'EMER' }))).toContain(
      'Admission type name cannot be empty'
    );
  });

  it('should return validation error when name exceeds 100 characters', () => {
    expect(
      errorsOf(createAdmissionTypeSchema.safeParse({ name: 'a'.repeat(101), code: 'EMER' }))
    ).toContain('Admission type name must be at most 100 characters');
  });

  it('should return validation error when code exceeds 10 characters', () => {
    expect(
      errorsOf(createAdmissionTypeSchema.safeParse({ name: 'Emergency', code: 'a'.repeat(11) }))
    ).toContain('Admission type code must be at most 10 characters');
  });

  it('should uppercase code and trim fields on successful parse', () => {
    expect(createAdmissionTypeSchema.parse({ name: ' Emergency ', code: ' emer ' })).toEqual({
      name: 'Emergency',
      code: 'EMER',
      description: undefined,
    });
  });

  it('should transform blank description to undefined', () => {
    expect(
      createAdmissionTypeSchema.parse({ name: 'Emergency', code: 'EMER', description: '   ' })
        .description
    ).toBeUndefined();
  });

  it('should transform null description to undefined', () => {
    expect(
      createAdmissionTypeSchema.parse({ name: 'Emergency', code: 'EMER', description: null })
        .description
    ).toBeUndefined();
  });

  it('should keep a provided description', () => {
    expect(
      createAdmissionTypeSchema.parse({
        name: 'Emergency',
        code: 'EMER',
        description: ' Standard outpatient consultation ',
      }).description
    ).toBe('Standard outpatient consultation');
  });

  it('should accept the same shape for update as for create', () => {
    expect(updateAdmissionTypeSchema.parse({ name: 'Elective', code: 'elec' })).toEqual({
      name: 'Elective',
      code: 'ELEC',
      description: undefined,
    });
  });

  it('should return validation error when description exceeds 500 characters', () => {
    expect(
      errorsOf(
        createAdmissionTypeSchema.safeParse({
          name: 'Emergency',
          code: 'EMER',
          description: 'a'.repeat(501),
        })
      )
    ).toContain('Admission type description must be at most 500 characters');
  });

  it('should validate id is a positive integer and tenant id is non-empty', () => {
    expect(admissionTypeIdSchema.safeParse('0').success).toBe(false);
    expect(admissionTypeIdSchema.safeParse('-1').success).toBe(false);
    expect(admissionTypeIdSchema.safeParse('1.5').success).toBe(false);
    expect(admissionTypeIdSchema.safeParse('abc').success).toBe(false);
    expect(admissionTypeIdSchema.parse('7')).toBe(7);
    expect(admissionTypeTenantIdSchema.safeParse('   ').success).toBe(false);
    expect(admissionTypeTenantIdSchema.parse(' tenant-1 ')).toBe('tenant-1');
  });

  it('should reject unsupported characters in name and code', () => {
    expect(
      errorsOf(createAdmissionTypeSchema.safeParse({ name: 'In.Person', code: 'INP' }))
    ).toContain(
      'Admission type name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    );

    expect(
      errorsOf(createAdmissionTypeSchema.safeParse({ name: 'In Person', code: 'IN.P' }))
    ).toContain(
      'Admission type code must contain only letters, numbers, hyphens, and underscores.'
    );
  });
});
