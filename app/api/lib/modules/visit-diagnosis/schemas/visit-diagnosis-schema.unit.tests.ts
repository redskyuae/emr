import { describe, expect, it } from 'vitest';

import {
  saveVisitDiagnosesSchema,
  VISIT_DIAGNOSIS_CODE_SYSTEMS,
  VISIT_DIAGNOSIS_TYPES,
  visitDiagnosisTenantIdSchema,
  visitDiagnosisVisitIdSchema,
} from './visit-diagnosis-schema';

const errorsOf = (payload: unknown) =>
  saveVisitDiagnosesSchema.safeParse(payload).error?.issues.map(({ message }) => message) ?? [];

const icd = (diagnosisCodeId: number, diagnosisType = 'SECONDARY') => ({
  codeSystem: 'ICD10CM',
  diagnosisCodeId,
  diagnosisType,
});
const ayurveda = (ayurvedaDiagnosisCodeId: number, diagnosisType = 'SECONDARY') => ({
  codeSystem: 'AYURVEDA',
  ayurvedaDiagnosisCodeId,
  diagnosisType,
});

describe('VisitDiagnosis schema', () => {
  it('should export the fixed code systems and diagnosis types', () => {
    expect(VISIT_DIAGNOSIS_CODE_SYSTEMS).toEqual(['ICD10CM', 'AYURVEDA']);
    expect(VISIT_DIAGNOSIS_TYPES).toEqual(['PRINCIPAL', 'SECONDARY']);
  });

  it('should accept an empty list to clear the diagnoses', () => {
    expect(saveVisitDiagnosesSchema.parse({ diagnoses: [] })).toEqual({ diagnoses: [] });
  });

  it('should require the diagnoses list', () => {
    expect(errorsOf({})).toEqual(['Diagnoses must be a list']);
  });

  it('should allow at most 20 diagnoses', () => {
    const diagnoses = [
      icd(1, 'PRINCIPAL'),
      ...Array.from({ length: 20 }, (_, index) => icd(index + 2)),
    ];

    expect(errorsOf({ diagnoses })).toEqual(['At most 20 diagnoses can be recorded on a Visit.']);
  });

  it('should require the Diagnosis Code that matches the code system', () => {
    expect(
      errorsOf({ diagnoses: [{ codeSystem: 'ICD10CM', diagnosisType: 'PRINCIPAL' }] })
    ).toEqual(['ICD-10-CM diagnoses need a Diagnosis Code.']);
    expect(
      errorsOf({
        diagnoses: [{ codeSystem: 'AYURVEDA', diagnosisCodeId: 3, diagnosisType: 'PRINCIPAL' }],
      })
    ).toEqual(['Ayurveda diagnoses need an Ayurveda Diagnosis Code.']);
  });

  it('should ignore the id that does not match the code system', () => {
    expect(
      saveVisitDiagnosesSchema.parse({
        diagnoses: [{ ...icd(4, 'PRINCIPAL'), ayurvedaDiagnosisCodeId: 9 }],
      }).diagnoses[0]
    ).toMatchObject({ diagnosisCodeId: 4, ayurvedaDiagnosisCodeId: null });
  });

  it('should require exactly one Principal per code system that has entries', () => {
    expect(errorsOf({ diagnoses: [icd(1), icd(2)] })).toEqual([
      'Choose exactly one Principal ICD-10-CM diagnosis.',
    ]);
    expect(errorsOf({ diagnoses: [ayurveda(1, 'PRINCIPAL'), ayurveda(2, 'PRINCIPAL')] })).toEqual([
      'Choose exactly one Principal Ayurveda diagnosis.',
    ]);
  });

  it('should accept one Principal in each code system independently', () => {
    expect(
      saveVisitDiagnosesSchema.safeParse({
        diagnoses: [icd(1, 'PRINCIPAL'), icd(2), ayurveda(3, 'PRINCIPAL')],
      }).success
    ).toBe(true);
  });

  it('should reject unknown code systems and diagnosis types', () => {
    expect(
      errorsOf({ diagnoses: [{ codeSystem: 'ICD9', diagnosisCodeId: 1, diagnosisType: 'X' }] })
    ).toEqual(
      expect.arrayContaining([
        'Diagnosis code system must be one of ICD10CM, AYURVEDA',
        'Diagnosis type must be one of PRINCIPAL, SECONDARY',
      ])
    );
  });

  it('should reject a non-positive Diagnosis Code id', () => {
    expect(errorsOf({ diagnoses: [icd(0, 'PRINCIPAL')] })).toContain(
      'Diagnosis code ID must be positive'
    );
  });

  it('should trim notes, turn blank notes into null, and cap them at 500 characters', () => {
    const [trimmed, blank, missing] = saveVisitDiagnosesSchema.parse({
      diagnoses: [
        { ...icd(1, 'PRINCIPAL'), notes: '  Morning stiffness  ' },
        { ...icd(2), notes: '   ' },
        icd(3),
      ],
    }).diagnoses;

    expect(trimmed.notes).toBe('Morning stiffness');
    expect(blank.notes).toBeNull();
    expect(missing.notes).toBeNull();
    expect(errorsOf({ diagnoses: [{ ...icd(1, 'PRINCIPAL'), notes: 'a'.repeat(501) }] })).toEqual([
      'Diagnosis notes must be at most 500 characters',
    ]);
  });

  it('should validate the Visit id and Tenant id', () => {
    expect(visitDiagnosisVisitIdSchema.safeParse('12').data).toBe(12);
    expect(visitDiagnosisVisitIdSchema.safeParse('abc').success).toBe(false);
    expect(visitDiagnosisTenantIdSchema.safeParse(' ').success).toBe(false);
  });
});
