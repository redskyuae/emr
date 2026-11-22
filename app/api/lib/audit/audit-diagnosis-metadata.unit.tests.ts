import { describe, expect, it } from 'vitest';

import type { VisitDiagnosis } from '@/app/api/lib/modules/visit-diagnosis/schemas/visit-diagnosis-schema';
import { diagnosisAuditMetadata } from './audit-diagnosis-metadata';

const diagnosis = (code: string) => ({ code }) as VisitDiagnosis;

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
});
