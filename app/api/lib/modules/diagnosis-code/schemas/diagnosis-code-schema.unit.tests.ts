import { describe, expect, it } from 'vitest';

import {
  createDiagnosisCodeSchema,
  diagnosisCodeIdSchema,
  diagnosisCodeTenantIdSchema,
  updateDiagnosisCodeSchema,
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

  it('should report only the empty error when code is blank', () => {
    expect(
      errorsOf(createDiagnosisCodeSchema.safeParse({ code: '   ', title: 'Hypertension' }))
    ).toEqual(['Diagnosis code cannot be empty']);
  });

  it.each(['M54.5', 'I10', 'E11.9', 'S72.001A', 'm06.9', 'O9A.119', 'Z3A.01', 'T81.4XXA'])(
    'should accept the ICD-10-CM code %s',
    (code) => {
      expect(createDiagnosisCodeSchema.safeParse({ code, title: 'Diagnosis' }).success).toBe(true);
    }
  );

  it.each(['U07.1', 'M5', '154', 'M54.', 'M54.12345', 'M54-5', 'MM5', 'M5C', 'M54.U'])(
    'should reject %s as not a valid ICD-10-CM code',
    (code) => {
      expect(errorsOf(createDiagnosisCodeSchema.safeParse({ code, title: 'Diagnosis' }))).toEqual([
        'Diagnosis code must be a valid ICD-10-CM code, e.g. M54.5.',
      ]);
    }
  );

  it('should apply the ICD-10-CM rule on update', () => {
    expect(
      errorsOf(updateDiagnosisCodeSchema.safeParse({ code: 'HTN', title: 'Hypertension' }))
    ).toEqual(['Diagnosis code must be a valid ICD-10-CM code, e.g. M54.5.']);
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
