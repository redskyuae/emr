import { describe, expect, it } from 'vitest';

import { clinicalNoteIdSchema, createClinicalNoteSchema } from './clinical-note-schema';

const errorsOf = (result: ReturnType<typeof createClinicalNoteSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('ClinicalNote schema', () => {
  it('should require a note type id', () => {
    expect(errorsOf(createClinicalNoteSchema.safeParse({ subjective: 'Cough' }))).toContain(
      'Clinical note type ID is required'
    );
  });

  it('should require at least one SOAP section', () => {
    expect(errorsOf(createClinicalNoteSchema.safeParse({ noteTypeId: 1 }))).toContain(
      'At least one clinical note section is required'
    );
  });

  it('should accept a note with a single section', () => {
    expect(createClinicalNoteSchema.safeParse({ noteTypeId: 1, assessment: 'URTI' }).success).toBe(
      true
    );
  });

  it('should treat whitespace-only sections as empty', () => {
    expect(
      errorsOf(createClinicalNoteSchema.safeParse({ noteTypeId: 1, subjective: '   ' }))
    ).toContain('At least one clinical note section is required');
  });

  it('should coerce a numeric-string note type id', () => {
    expect(createClinicalNoteSchema.parse({ noteTypeId: '3', plan: 'Rest' }).noteTypeId).toBe(3);
  });

  it('should validate clinical note id is positive', () => {
    expect(clinicalNoteIdSchema.safeParse('1').success).toBe(true);
    expect(clinicalNoteIdSchema.safeParse('0').success).toBe(false);
  });

  it('should accept a visit or an admission parent alone', () => {
    expect(
      createClinicalNoteSchema.safeParse({ noteTypeId: 3, plan: 'Rest', visitId: 5 }).success
    ).toBe(true);
    expect(
      createClinicalNoteSchema.safeParse({ noteTypeId: 3, plan: 'Rest', admissionId: 5 }).success
    ).toBe(true);
  });

  it('should reject a note referencing both a visit and an admission', () => {
    expect(
      errorsOf(
        createClinicalNoteSchema.safeParse({
          noteTypeId: 3,
          plan: 'Rest',
          visitId: 5,
          admissionId: 6,
        })
      )
    ).toContain('A record may reference a Visit or an Admission, not both.');
  });
});
