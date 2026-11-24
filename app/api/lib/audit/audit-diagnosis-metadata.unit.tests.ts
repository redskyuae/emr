import { describe, expect, it } from 'vitest';

import type { VisitDiagnosis } from '@/app/api/lib/modules/visit-diagnosis/schemas/visit-diagnosis-schema';
import { diagnosisAuditMetadata } from './audit-diagnosis-metadata';

const diagnosis = (
  code: string,
  diagnosisType: VisitDiagnosis['diagnosisType'] = 'SECONDARY',
  notes: string | null = null
) => ({ code, diagnosisType, notes }) as VisitDiagnosis;

describe('diagnosisAuditMetadata', () => {
  it('should list the codes a save added and removed', () => {
    expect(
      diagnosisAuditMetadata(
        [diagnosis('M54.5'), diagnosis('R51')],
        [diagnosis('M54.5'), diagnosis('J06.9')]
      )
    ).toEqual({ added: ['J06.9'], removed: ['R51'] });
  });

  it('should report no change when the list is the same', () => {
    expect(diagnosisAuditMetadata([diagnosis('R51')], [diagnosis('R51')])).toEqual({
      added: [],
      removed: [],
    });
  });

  it('should record a kept code whose diagnosis type changed', () => {
    expect(
      diagnosisAuditMetadata(
        [diagnosis('M54.5', 'PRINCIPAL'), diagnosis('R51', 'SECONDARY')],
        [diagnosis('M54.5', 'SECONDARY'), diagnosis('R51', 'PRINCIPAL')]
      )
    ).toEqual({
      added: [],
      removed: [],
      changed: [
        {
          code: 'M54.5',
          from: { type: 'PRINCIPAL', notes: null },
          to: { type: 'SECONDARY', notes: null },
        },
        {
          code: 'R51',
          from: { type: 'SECONDARY', notes: null },
          to: { type: 'PRINCIPAL', notes: null },
        },
      ],
    });
  });

  it('should record a kept code whose notes changed alongside added and removed codes', () => {
    expect(
      diagnosisAuditMetadata(
        [diagnosis('M54.5', 'PRINCIPAL', 'Acute'), diagnosis('R51')],
        [diagnosis('M54.5', 'PRINCIPAL', 'Chronic, review in 2 weeks'), diagnosis('J06.9')]
      )
    ).toEqual({
      added: ['J06.9'],
      removed: ['R51'],
      changed: [
        {
          code: 'M54.5',
          from: { type: 'PRINCIPAL', notes: 'Acute' },
          to: { type: 'PRINCIPAL', notes: 'Chronic, review in 2 weeks' },
        },
      ],
    });
  });
});
