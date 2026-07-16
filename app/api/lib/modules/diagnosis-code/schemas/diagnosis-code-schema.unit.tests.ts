import { describe, expect, it } from 'vitest';

import {
  createDiagnosisCodeSchema,
  diagnosisCodeIdSchema,
  diagnosisCodeTenantIdSchema,
} from './diagnosis-code-schema';

const errorsOf = (result: ReturnType<typeof createDiagnosisCodeSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('DiagnosisCode schema', () => {
  it('should return validation error when code is missing', () => {
    expect(errorsOf(createDiagnosisCodeSchema.safeParse({ title: 'Hypertension' }))).toContain(
      'Diagnosis code is required'
    );
  });

  it('should return validation error when code is empty after trimming', () => {
    expect(
      errorsOf(createDiagnosisCodeSchema.safeParse({ code: '   ', title: 'Hypertension' }))
    ).toContain('Diagnosis code cannot be empty');
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(createDiagnosisCodeSchema.safeParse({ code: 'A'.repeat(11), title: 'Hypertension' }))
    ).toContain('Diagnosis code must be at most 10 characters');
  });

  it('should return validation error when title is missing', () => {
    expect(errorsOf(createDiagnosisCodeSchema.safeParse({ code: 'I10' }))).toContain(
      'Diagnosis code title is required'
    );
  });

  it('should return validation error when title exceeds max length', () => {
    expect(
      errorsOf(createDiagnosisCodeSchema.safeParse({ code: 'I10', title: 'a'.repeat(256) }))
    ).toContain('Diagnosis code title must be at most 255 characters');
  });

  it('should uppercase code on successful parse', () => {
    expect(createDiagnosisCodeSchema.parse({ code: 'i10', title: 'Hypertension' }).code).toBe(
      'I10'
    );
  });

  it('should trim code/title/category on successful parse', () => {
    expect(
      createDiagnosisCodeSchema.parse({
        code: ' i10 ',
        title: ' Essential hypertension ',
        category: ' Circulatory ',
      })
    ).toEqual({
      code: 'I10',
      title: 'Essential hypertension',
      category: 'Circulatory',
    });
  });

  it('should transform empty category to undefined', () => {
    expect(
      createDiagnosisCodeSchema.parse({ code: 'I10', title: 'Hypertension', category: '   ' })
        .category
    ).toBeUndefined();
  });

  it('should validate diagnosis code id is positive integer', () => {
    expect(diagnosisCodeIdSchema.safeParse('1').success).toBe(true);
    expect(diagnosisCodeIdSchema.safeParse('0').success).toBe(false);
    expect(diagnosisCodeIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(diagnosisCodeTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(diagnosisCodeTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
