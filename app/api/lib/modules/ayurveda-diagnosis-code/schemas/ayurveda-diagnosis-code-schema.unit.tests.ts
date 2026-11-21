import { describe, expect, it } from 'vitest';

import {
  ayurvedaDiagnosisCodeIdSchema,
  ayurvedaDiagnosisCodeTenantIdSchema,
  createAyurvedaDiagnosisCodeSchema,
  updateAyurvedaDiagnosisCodeSchema,
} from './ayurveda-diagnosis-code-schema';

const errorsOf = (result: ReturnType<typeof createAyurvedaDiagnosisCodeSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

const validPayload = { code: 'AYU-AMV', name: 'Amavata' };

describe('AyurvedaDiagnosisCode schema', () => {
  it('should return validation error when code is missing', () => {
    expect(errorsOf(createAyurvedaDiagnosisCodeSchema.safeParse({ name: 'Amavata' }))).toContain(
      'Ayurveda diagnosis code is required'
    );
  });

  it('should return only the empty error when code is blank', () => {
    expect(
      errorsOf(createAyurvedaDiagnosisCodeSchema.safeParse({ ...validPayload, code: '   ' }))
    ).toEqual(['Ayurveda diagnosis code cannot be empty']);
  });

  it('should return validation error when code exceeds 20 characters', () => {
    expect(
      errorsOf(
        createAyurvedaDiagnosisCodeSchema.safeParse({ ...validPayload, code: 'A'.repeat(21) })
      )
    ).toEqual(['Ayurveda diagnosis code must be at most 20 characters']);
  });

  it('should reject unsupported characters in code', () => {
    expect(
      errorsOf(createAyurvedaDiagnosisCodeSchema.safeParse({ ...validPayload, code: 'AYU AMV' }))
    ).toEqual(['Ayurveda diagnosis code must contain only letters, numbers, hyphens, and dots.']);
  });

  it('should return validation error when name is missing or blank', () => {
    expect(errorsOf(createAyurvedaDiagnosisCodeSchema.safeParse({ code: 'AYU-AMV' }))).toContain(
      'Ayurveda diagnosis name is required'
    );
    expect(
      errorsOf(createAyurvedaDiagnosisCodeSchema.safeParse({ ...validPayload, name: '  ' }))
    ).toContain('Ayurveda diagnosis name cannot be empty');
  });

  it('should enforce the name, English name, and category limits', () => {
    expect(
      errorsOf(
        createAyurvedaDiagnosisCodeSchema.safeParse({
          ...validPayload,
          name: 'a'.repeat(256),
          englishName: 'b'.repeat(256),
          category: 'c'.repeat(101),
        })
      )
    ).toEqual([
      'Ayurveda diagnosis name must be at most 255 characters',
      'Ayurveda diagnosis category must be at most 100 characters',
      'Ayurveda diagnosis English name must be at most 255 characters',
    ]);
  });

  it('should trim fields, uppercase code, and default the ICD mapping to null', () => {
    expect(
      createAyurvedaDiagnosisCodeSchema.parse({
        code: ' ayu-amv.1 ',
        name: ' Amavata ',
        englishName: ' Rheumatoid arthritis ',
        category: ' Vatavyadhi ',
      })
    ).toEqual({
      code: 'AYU-AMV.1',
      name: 'Amavata',
      englishName: 'Rheumatoid arthritis',
      category: 'Vatavyadhi',
      icdDiagnosisCodeId: null,
    });
  });

  it('should turn blank or null optional text into undefined', () => {
    expect(
      createAyurvedaDiagnosisCodeSchema.parse({
        ...validPayload,
        englishName: '  ',
        category: null,
      })
    ).toMatchObject({ englishName: undefined, category: undefined });
  });

  it('should accept a positive ICD-10-CM mapping id or null', () => {
    expect(
      createAyurvedaDiagnosisCodeSchema.parse({ ...validPayload, icdDiagnosisCodeId: 5 })
        .icdDiagnosisCodeId
    ).toBe(5);
    expect(
      updateAyurvedaDiagnosisCodeSchema.parse({ ...validPayload, icdDiagnosisCodeId: null })
        .icdDiagnosisCodeId
    ).toBeNull();
  });

  it('should reject an invalid ICD-10-CM mapping id', () => {
    expect(
      errorsOf(
        createAyurvedaDiagnosisCodeSchema.safeParse({ ...validPayload, icdDiagnosisCodeId: 0 })
      )
    ).toEqual(['ICD-10-CM diagnosis code ID must be positive']);
    expect(
      createAyurvedaDiagnosisCodeSchema.safeParse({ ...validPayload, icdDiagnosisCodeId: '5' })
        .success
    ).toBe(false);
  });

  it('should validate the id and tenant id', () => {
    expect(ayurvedaDiagnosisCodeIdSchema.safeParse('3').data).toBe(3);
    expect(ayurvedaDiagnosisCodeIdSchema.safeParse('0').success).toBe(false);
    expect(ayurvedaDiagnosisCodeTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
