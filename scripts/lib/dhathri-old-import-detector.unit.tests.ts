import { describe, expect, it } from 'vitest';

import {
  detectPriorUnsafeImports,
  type TreatmentForUnsafeImportDetection,
} from './dhathri-old-import-detector';

function treatment(
  overrides: Partial<TreatmentForUnsafeImportDetection> = {}
): TreatmentForUnsafeImportDetection {
  return {
    id: 10,
    code: 'LEG001',
    name: 'Oil Therapy',
    legacySourceIdentity: null,
    durationMinutes: 60,
    setupMinutes: 10,
    cleaningMinutes: 5,
    roomType: 'Panchakarma room',
    therapistSkill: 'Abhyanga',
    sessionCount: 4,
    matchingSessionMetadataCount: 4,
    ...overrides,
  };
}

describe('detectPriorUnsafeImports', () => {
  it('detects an exact workbook display identity with the retired fabricated metadata', () => {
    expect(detectPriorUnsafeImports([treatment()], ['LEG001_Oil Therapy'])).toEqual([
      expect.objectContaining({ id: 10, code: 'LEG001' }),
    ]);
  });

  it('does not flag Treatments with provenance, different metadata, or known seed codes', () => {
    expect(
      detectPriorUnsafeImports(
        [
          treatment({ legacySourceIdentity: 'LEG001_Oil Therapy' }),
          treatment({ id: 11, durationMinutes: null }),
          treatment({ id: 12, code: 'TRT-0400', name: 'Oil Therapy' }),
        ],
        ['LEG001_Oil Therapy', 'TRT-0400_Oil Therapy']
      )
    ).toEqual([]);
  });
});
