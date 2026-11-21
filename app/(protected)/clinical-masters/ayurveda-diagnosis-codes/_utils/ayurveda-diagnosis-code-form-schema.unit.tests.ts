import { describe, expect, it } from 'vitest';

import {
  ayurvedaDiagnosisCodeFormSchema,
  getAyurvedaDiagnosisCodeErrorField,
} from './ayurveda-diagnosis-code-form-schema';

const base = {
  code: 'ayu-amv',
  name: 'Amavata',
  englishName: '',
  category: '',
  icdDiagnosisCodeId: null,
};

function messagesFor(values: Record<string, unknown>) {
  const result = ayurvedaDiagnosisCodeFormSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('ayurvedaDiagnosisCodeFormSchema', () => {
  it('should uppercase the code and drop blank optional fields', () => {
    expect(ayurvedaDiagnosisCodeFormSchema.parse(base)).toEqual({
      code: 'AYU-AMV',
      name: 'Amavata',
      englishName: undefined,
      category: undefined,
      icdDiagnosisCodeId: null,
    });
  });

  it('should keep a trimmed English name, Category and ICD-10-CM mapping', () => {
    expect(
      ayurvedaDiagnosisCodeFormSchema.parse({
        ...base,
        code: ' AYU.12 ',
        englishName: ' Rheumatoid arthritis ',
        category: ' Vatavyadhi ',
        icdDiagnosisCodeId: 42,
      })
    ).toEqual({
      code: 'AYU.12',
      name: 'Amavata',
      englishName: 'Rheumatoid arthritis',
      category: 'Vatavyadhi',
      icdDiagnosisCodeId: 42,
    });
  });

  it('should require a code and a name', () => {
    expect(messagesFor({ ...base, code: '  ', name: '' })).toEqual([
      'Ayurveda diagnosis name is required.',
      'Ayurveda diagnosis code is required.',
    ]);
  });

  it('should allow only letters, numbers, hyphens and dots in the code', () => {
    expect(messagesFor({ ...base, code: 'AYU_AMV' })).toEqual([
      'Ayurveda diagnosis code must contain only letters, numbers, hyphens, and dots.',
    ]);
    expect(messagesFor({ ...base, code: 'AYU AMV' })).toHaveLength(1);
  });

  it('should enforce the contract length limits', () => {
    expect(messagesFor({ ...base, code: 'A'.repeat(20) })).toEqual([]);
    expect(messagesFor({ ...base, code: 'A'.repeat(21) })).toEqual([
      'Ayurveda diagnosis code must be at most 20 characters.',
    ]);
    expect(messagesFor({ ...base, name: 'N'.repeat(256) })).toEqual([
      'Ayurveda diagnosis name must be at most 255 characters.',
    ]);
    expect(messagesFor({ ...base, englishName: 'E'.repeat(256) })).toEqual([
      'English name must be at most 255 characters.',
    ]);
    expect(messagesFor({ ...base, category: 'C'.repeat(101) })).toEqual([
      'Category must be at most 100 characters.',
    ]);
  });
});

describe('getAyurvedaDiagnosisCodeErrorField', () => {
  it('should map API messages to the field they name', () => {
    expect(
      getAyurvedaDiagnosisCodeErrorField('Ayurveda diagnosis code AYU-AMV already exists.')
    ).toBe('code');
    expect(
      getAyurvedaDiagnosisCodeErrorField('Ayurveda diagnosis name must be at most 255 characters')
    ).toBe('name');
    expect(getAyurvedaDiagnosisCodeErrorField('Ayurveda diagnosis English name is too long')).toBe(
      'englishName'
    );
    expect(getAyurvedaDiagnosisCodeErrorField('Ayurveda diagnosis category is too long')).toBe(
      'category'
    );
    expect(
      getAyurvedaDiagnosisCodeErrorField('ICD-10-CM diagnosis code ID must be an integer')
    ).toBe('icdDiagnosisCodeId');
    expect(getAyurvedaDiagnosisCodeErrorField('Diagnosis code 999 is Invalid.')).toBe(
      'icdDiagnosisCodeId'
    );
  });

  it('should leave messages that name no single field unmapped', () => {
    expect(
      getAyurvedaDiagnosisCodeErrorField('Ayurveda diagnosis code ID 7 is Invalid.')
    ).toBeNull();
    expect(getAyurvedaDiagnosisCodeErrorField('Ayurveda diagnosis code 7 is Invalid.')).toBeNull();
    expect(getAyurvedaDiagnosisCodeErrorField('Ayurveda diagnosis code not found')).toBeNull();
    expect(getAyurvedaDiagnosisCodeErrorField('Unauthorized')).toBeNull();
  });
});
