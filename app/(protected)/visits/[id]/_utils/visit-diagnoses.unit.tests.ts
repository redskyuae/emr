import { describe, expect, it } from 'vitest';

import type { VisitDiagnosis } from '@/app/api/lib/modules/visit-diagnosis/schemas/visit-diagnosis-schema';
import {
  setPrimaryDiagnosis,
  setSecondaryDiagnoses,
  toDiagnosisDrafts,
  toSaveVisitDiagnosesRequest,
  type DiagnosisDraft,
  type DiagnosisOption,
} from './visit-diagnoses';

const ra: DiagnosisOption = {
  codeId: 12,
  codeSystem: 'ICD10CM',
  code: 'M06.9',
  title: 'Rheumatoid arthritis, unspecified',
  englishName: null,
  icdMapping: null,
};
const backPain: DiagnosisOption = { ...ra, codeId: 13, code: 'M54.5', title: 'Low back pain' };
const obesity: DiagnosisOption = { ...ra, codeId: 14, code: 'E66.9', title: 'Obesity' };
const amavata: DiagnosisOption = {
  codeId: 4,
  codeSystem: 'AYURVEDA',
  code: 'AYU-AMV',
  title: 'Amavata',
  englishName: 'Rheumatoid arthritis',
  icdMapping: { id: 12, code: 'M06.9', title: 'Rheumatoid arthritis, unspecified' },
};

function summary(drafts: DiagnosisDraft[]) {
  return drafts.map((draft) => [draft.code, draft.diagnosisType]);
}

describe('setPrimaryDiagnosis', () => {
  it('should set the Primary of one code system without touching the other', () => {
    const drafts = setPrimaryDiagnosis(setPrimaryDiagnosis([], 'AYURVEDA', amavata), 'ICD10CM', ra);

    expect(summary(drafts)).toEqual([
      ['AYU-AMV', 'PRINCIPAL'],
      ['M06.9', 'PRINCIPAL'],
    ]);
  });

  it('should replace the Primary and take a Secondary out of the Secondary list', () => {
    const start = setSecondaryDiagnoses(setPrimaryDiagnosis([], 'ICD10CM', ra), 'ICD10CM', [
      backPain,
      obesity,
    ]);

    expect(summary(setPrimaryDiagnosis(start, 'ICD10CM', backPain))).toEqual([
      ['M54.5', 'PRINCIPAL'],
      ['E66.9', 'SECONDARY'],
    ]);
  });

  it('should promote the first Secondary when the Primary is cleared', () => {
    const start = setSecondaryDiagnoses(setPrimaryDiagnosis([], 'ICD10CM', ra), 'ICD10CM', [
      backPain,
      obesity,
    ]);

    expect(summary(setPrimaryDiagnosis(start, 'ICD10CM', null))).toEqual([
      ['M54.5', 'PRINCIPAL'],
      ['E66.9', 'SECONDARY'],
    ]);
  });

  it('should keep the notes of a code that was already recorded', () => {
    const start: DiagnosisDraft[] = [{ ...backPain, diagnosisType: 'SECONDARY', notes: 'Chronic' }];

    expect(setPrimaryDiagnosis(start, 'ICD10CM', backPain)[0].notes).toBe('Chronic');
  });
});

describe('setSecondaryDiagnoses', () => {
  it('should never list the Primary or a repeat as a Secondary', () => {
    const drafts = setSecondaryDiagnoses(setPrimaryDiagnosis([], 'ICD10CM', ra), 'ICD10CM', [
      ra,
      backPain,
      backPain,
    ]);

    expect(summary(drafts)).toEqual([
      ['M06.9', 'PRINCIPAL'],
      ['M54.5', 'SECONDARY'],
    ]);
  });

  it('should make the first choice Principal when there is no Primary yet', () => {
    expect(summary(setSecondaryDiagnoses([], 'ICD10CM', [backPain, obesity]))).toEqual([
      ['M54.5', 'PRINCIPAL'],
      ['E66.9', 'SECONDARY'],
    ]);
  });
});

describe('toSaveVisitDiagnosesRequest', () => {
  it('should send each code against its own system with Principal first and blank notes as null', () => {
    const drafts = setSecondaryDiagnoses(
      setPrimaryDiagnosis(setPrimaryDiagnosis([], 'AYURVEDA', amavata), 'ICD10CM', backPain),
      'ICD10CM',
      [ra]
    );

    expect(toSaveVisitDiagnosesRequest(drafts)).toEqual({
      diagnoses: [
        {
          codeSystem: 'AYURVEDA',
          ayurvedaDiagnosisCodeId: 4,
          diagnosisType: 'PRINCIPAL',
          notes: null,
        },
        { codeSystem: 'ICD10CM', diagnosisCodeId: 13, diagnosisType: 'PRINCIPAL', notes: null },
        { codeSystem: 'ICD10CM', diagnosisCodeId: 12, diagnosisType: 'SECONDARY', notes: null },
      ],
    });
  });
});

describe('toDiagnosisDrafts', () => {
  it('should read the master id from the field matching the code system', () => {
    const saved = [
      {
        id: 1,
        visitId: 7,
        codeSystem: 'AYURVEDA',
        diagnosisType: 'PRINCIPAL',
        sortOrder: 1,
        notes: null,
        code: 'AYU-AMV',
        title: 'Amavata',
        englishName: 'Rheumatoid arthritis',
        diagnosisCodeId: null,
        ayurvedaDiagnosisCodeId: 4,
        icdMapping: null,
      },
    ] as VisitDiagnosis[];

    expect(toDiagnosisDrafts(saved)).toEqual([
      expect.objectContaining({ codeId: 4, codeSystem: 'AYURVEDA', notes: '' }),
    ]);
  });
});
