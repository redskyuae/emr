import { describe, expect, it } from 'vitest';

import {
  clinicalNoteTypeIdSchema,
  clinicalNoteTypeTenantIdSchema,
  createClinicalNoteTypeSchema,
} from './clinical-note-type-schema';

const errorsOf = (result: ReturnType<typeof createClinicalNoteTypeSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('ClinicalNoteType schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createClinicalNoteTypeSchema.safeParse({ code: 'PROG' }))).toContain(
      'Clinical note type name is required'
    );
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(createClinicalNoteTypeSchema.safeParse({ name: 'a'.repeat(101), code: 'PROG' }))
    ).toContain('Clinical note type name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(errorsOf(createClinicalNoteTypeSchema.safeParse({ name: 'Progress Note' }))).toContain(
      'Clinical note type code is required'
    );
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(
        createClinicalNoteTypeSchema.safeParse({ name: 'Progress Note', code: 'A'.repeat(21) })
      )
    ).toContain('Clinical note type code must be at most 20 characters');
  });

  it('should uppercase code on successful parse', () => {
    expect(createClinicalNoteTypeSchema.parse({ name: 'Progress Note', code: 'prog' }).code).toBe(
      'PROG'
    );
  });

  it('should trim name/code/description on successful parse', () => {
    expect(
      createClinicalNoteTypeSchema.parse({
        name: ' Progress Note ',
        code: ' prog ',
        description: ' Daily progress ',
      })
    ).toEqual({
      name: 'Progress Note',
      code: 'PROG',
      description: 'Daily progress',
    });
  });

  it('should transform empty description to undefined', () => {
    expect(
      createClinicalNoteTypeSchema.parse({
        name: 'Progress Note',
        code: 'PROG',
        description: '   ',
      }).description
    ).toBeUndefined();
  });

  it('should validate clinical note type id is positive integer', () => {
    expect(clinicalNoteTypeIdSchema.safeParse('1').success).toBe(true);
    expect(clinicalNoteTypeIdSchema.safeParse('0').success).toBe(false);
    expect(clinicalNoteTypeIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(clinicalNoteTypeTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(clinicalNoteTypeTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
