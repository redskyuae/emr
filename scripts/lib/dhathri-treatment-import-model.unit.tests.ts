import { describe, expect, it } from 'vitest';

import type { DhathriWorkbookRow } from './dhathri-workbook-reader';
import { analyzeDhathriTreatmentRows } from './dhathri-treatment-import-model';

function row(
  sourceRowNumber: number,
  overrides: Partial<DhathriWorkbookRow['normalized']> = {}
): DhathriWorkbookRow {
  const normalized = {
    treatment: 'TRT001_Oil Therapy',
    totalSession: '2',
    mrn: 'MRN-1',
    visitId: 'VISIT-1',
    visitNumber: '1001',
    treatmentStatus: 'Pending',
    sessionNumber: null,
    conductionNote: null,
    sessionStatus: 'Not Start',
    ...overrides,
  };
  return { sourceRowNumber, raw: normalized, normalized };
}

describe('Dhathri Treatment import model', () => {
  it('should retain every Treatment as a separate Plan for the same Patient and Visit', () => {
    const result = analyzeDhathriTreatmentRows('tenant-1', [
      row(2),
      row(3, { treatment: 'TRT002_Herbal Bandage' }),
      row(4, { treatment: 'TRT003_Nasyam' }),
    ]);

    expect(result.quarantines).toEqual([]);
    expect(result.candidates).toHaveLength(3);
    expect(result.candidates.map((candidate) => candidate.treatmentCode).sort()).toEqual([
      'TRT001',
      'TRT002',
      'TRT003',
    ]);
    expect(result.candidates.every((candidate) => candidate.sessions.length === 2)).toBe(true);
  });

  it('splits only the first underscore and derives a valid code when none exists', () => {
    const result = analyzeDhathriTreatmentRows('tenant-1', [
      row(2, { treatment: 'CODE_Name_With_Underscores' }),
      row(3, {
        treatment: 'A treatment name that is longer than twenty characters',
        visitId: 'VISIT-2',
      }),
    ]);

    expect(result.quarantines).toEqual([]);
    expect(result.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          treatmentIdentity: 'CODE_Name_With_Underscores',
          treatmentCode: 'CODE',
          treatmentName: 'Name_With_Underscores',
        }),
        expect.objectContaining({
          treatmentIdentity: 'A treatment name that is longer than twenty characters',
          treatmentCode: 'ATREATMENTNAMETHATIS',
          treatmentName: 'A treatment name that is longer than twenty characters',
        }),
      ])
    );
  });

  it('does not cap prescribed Sessions', () => {
    const result = analyzeDhathriTreatmentRows('tenant-1', [row(2, { totalSession: '100' })]);

    expect(result.candidates[0].sessions).toHaveLength(100);
    expect(result.candidates[0].sessions.at(-1)?.sessionNumber).toBe(100);
  });

  it('should derive completed evidence and preserve missing Sessions as Pending', () => {
    const result = analyzeDhathriTreatmentRows('tenant-1', [
      row(2, {
        treatmentStatus: 'Progress',
        sessionNumber: '1',
        sessionStatus: 'Completed',
        conductionNote: 'Completed well',
      }),
    ]);

    expect(result.candidates[0].sessions).toEqual([
      { sessionNumber: 1, completionStatus: 'COMPLETED', conductionNote: 'Completed well' },
      { sessionNumber: 2, completionStatus: 'PENDING', conductionNote: null },
    ]);
  });

  it('should quarantine contradictory and duplicate clinical evidence', () => {
    const result = analyzeDhathriTreatmentRows('tenant-1', [
      row(2, { sessionNumber: '1', sessionStatus: 'Completed' }),
      row(3, { sessionNumber: '1', sessionStatus: 'Completed' }),
    ]);

    expect(result.candidates).toEqual([]);
    expect(result.quarantines[0].reasons.map((item) => item.code)).toEqual(
      expect.arrayContaining(['DUPLICATE_SESSION_NUMBER', 'STATUS_SESSION_CONTRADICTION'])
    );
  });

  it('should quarantine missing Patient identity and invalid counts', () => {
    const result = analyzeDhathriTreatmentRows('tenant-1', [
      row(2, { mrn: null, totalSession: '0' }),
    ]);

    expect(result.candidates).toEqual([]);
    expect(result.quarantines[0].reasons.map((item) => item.code)).toEqual(
      expect.arrayContaining(['MISSING_MRN', 'INVALID_TOTAL_SESSION'])
    );
  });
});
