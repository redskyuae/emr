import { describe, expect, it } from 'vitest';

import {
  createVisitTypeSchema,
  updateVisitTypeSchema,
  visitTypeIdSchema,
  visitTypeTenantIdSchema,
} from './visit-type-schema';

const errorsOf = (result: ReturnType<typeof createVisitTypeSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('VisitType schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createVisitTypeSchema.safeParse({ code: 'OPD' }))).toContain(
      'Visit type name is required'
    );
  });

  it('should return validation error when code is missing', () => {
    expect(errorsOf(createVisitTypeSchema.safeParse({ name: 'OPD Consultation' }))).toContain(
      'Visit type code is required'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(errorsOf(createVisitTypeSchema.safeParse({ name: '   ', code: 'OPD' }))).toContain(
      'Visit type name cannot be empty'
    );
  });

  it('should return validation error when name exceeds 100 characters', () => {
    expect(
      errorsOf(createVisitTypeSchema.safeParse({ name: 'a'.repeat(101), code: 'OPD' }))
    ).toContain('Visit type name must be at most 100 characters');
  });

  it('should return validation error when code exceeds 10 characters', () => {
    expect(
      errorsOf(createVisitTypeSchema.safeParse({ name: 'OPD Consultation', code: 'a'.repeat(11) }))
    ).toContain('Visit type code must be at most 10 characters');
  });

  it('should uppercase code and trim fields on successful parse', () => {
    expect(createVisitTypeSchema.parse({ name: ' OPD Consultation ', code: ' opd ' })).toEqual({
      name: 'OPD Consultation',
      code: 'OPD',
      description: undefined,
    });
  });

  it('should transform blank description to undefined', () => {
    expect(
      createVisitTypeSchema.parse({ name: 'OPD Consultation', code: 'OPD', description: '   ' })
        .description
    ).toBeUndefined();
  });

  it('should transform null description to undefined', () => {
    expect(
      createVisitTypeSchema.parse({ name: 'OPD Consultation', code: 'OPD', description: null })
        .description
    ).toBeUndefined();
  });

  it('should keep a provided description', () => {
    expect(
      createVisitTypeSchema.parse({
        name: 'OPD Consultation',
        code: 'OPD',
        description: ' Standard outpatient consultation ',
      }).description
    ).toBe('Standard outpatient consultation');
  });

  it('should accept the same shape for update as for create', () => {
    expect(updateVisitTypeSchema.parse({ name: 'Follow-up', code: 'fup' })).toEqual({
      name: 'Follow-up',
      code: 'FUP',
      description: undefined,
    });
  });

  it('should return validation error when description exceeds 500 characters', () => {
    expect(
      errorsOf(
        createVisitTypeSchema.safeParse({
          name: 'OPD Consultation',
          code: 'OPD',
          description: 'a'.repeat(501),
        })
      )
    ).toContain('Visit type description must be at most 500 characters');
  });

  it('should validate id is a positive integer and tenant id is non-empty', () => {
    expect(visitTypeIdSchema.safeParse('0').success).toBe(false);
    expect(visitTypeIdSchema.safeParse('-1').success).toBe(false);
    expect(visitTypeIdSchema.safeParse('1.5').success).toBe(false);
    expect(visitTypeIdSchema.safeParse('abc').success).toBe(false);
    expect(visitTypeIdSchema.parse('7')).toBe(7);
    expect(visitTypeTenantIdSchema.safeParse('   ').success).toBe(false);
    expect(visitTypeTenantIdSchema.parse(' tenant-1 ')).toBe('tenant-1');
  });

  it('should reject unsupported characters in name and code', () => {
    expect(errorsOf(createVisitTypeSchema.safeParse({ name: 'In.Person', code: 'INP' }))).toContain(
      'Visit type name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    );

    expect(
      errorsOf(createVisitTypeSchema.safeParse({ name: 'In Person', code: 'IN.P' }))
    ).toContain('Visit type code must contain only letters, numbers, hyphens, and underscores.');
  });
});
