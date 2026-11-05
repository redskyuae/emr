import { describe, expect, it } from 'vitest';

import {
  createAyurvedaDiagnosisCodeSchema,
  ayurvedaDiagnosisCodeIdSchema,
  ayurvedaDiagnosisCodeTenantIdSchema,
} from './ayurveda-diagnosis-code-schema';

const errorsOf = (result: ReturnType<typeof createAyurvedaDiagnosisCodeSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('AyurvedaDiagnosisCode schema', () => {
  it('should return validation error when code is missing', () => {
    expect(
      errorsOf(createAyurvedaDiagnosisCodeSchema.safeParse({ title: 'Hypertension' }))
    ).toContain('Ayurveda diagnosis code is required');
  });

  it('should return validation error when code is empty after trimming', () => {
    expect(
      errorsOf(createAyurvedaDiagnosisCodeSchema.safeParse({ code: '   ', title: 'Hypertension' }))
    ).toContain('Ayurveda diagnosis code cannot be empty');
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(
        createAyurvedaDiagnosisCodeSchema.safeParse({ code: 'A'.repeat(21), title: 'Hypertension' })
      )
    ).toContain('Ayurveda diagnosis code must be at most 20 characters');
  });

  it('should return validation error when title is missing', () => {
    expect(errorsOf(createAyurvedaDiagnosisCodeSchema.safeParse({ code: 'AYU-JVARA' }))).toContain(
      'Ayurveda diagnosis code title is required'
    );
  });

  it('should return validation error when title exceeds max length', () => {
    expect(
      errorsOf(
        createAyurvedaDiagnosisCodeSchema.safeParse({ code: 'AYU-JVARA', title: 'a'.repeat(256) })
      )
    ).toContain('Ayurveda diagnosis code title must be at most 255 characters');
  });

  it('should uppercase code on successful parse', () => {
    expect(
      createAyurvedaDiagnosisCodeSchema.parse({ code: 'ayu-jvara', title: 'Hypertension' }).code
    ).toBe('AYU-JVARA');
  });

  it('should trim code/title/category on successful parse', () => {
    expect(
      createAyurvedaDiagnosisCodeSchema.parse({
        code: ' ayu-jvara ',
        title: ' Jvara (Fever) ',
        category: ' Circulatory ',
      })
    ).toEqual({
      code: 'AYU-JVARA',
      title: 'Jvara (Fever)',
      category: 'Circulatory',
    });
  });

  it('should transform empty category to undefined', () => {
    expect(
      createAyurvedaDiagnosisCodeSchema.parse({
        code: 'AYU-JVARA',
        title: 'Hypertension',
        category: '   ',
      }).category
    ).toBeUndefined();
  });

  it('should validate Ayurveda diagnosis code id is positive integer', () => {
    expect(ayurvedaDiagnosisCodeIdSchema.safeParse('1').success).toBe(true);
    expect(ayurvedaDiagnosisCodeIdSchema.safeParse('0').success).toBe(false);
    expect(ayurvedaDiagnosisCodeIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(ayurvedaDiagnosisCodeTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(ayurvedaDiagnosisCodeTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
