import { describe, expect, it } from 'vitest';

import { createPatientProblemSchema, patientProblemIdSchema } from './patient-problem-schema';

const errorsOf = (result: ReturnType<typeof createPatientProblemSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('PatientProblem schema', () => {
  it('should require either a diagnosis code or a title', () => {
    expect(errorsOf(createPatientProblemSchema.safeParse({}))).toContain(
      'Problem requires either a diagnosis code or a free-text title'
    );
  });

  it('should accept a diagnosis code without a title', () => {
    expect(createPatientProblemSchema.safeParse({ diagnosisCodeId: 3 }).success).toBe(true);
  });

  it('should default clinical status to active', () => {
    expect(createPatientProblemSchema.parse({ title: 'Hypertension' }).clinicalStatus).toBe(
      'active'
    );
  });

  it('should reject a resolved date when status is not resolved', () => {
    expect(
      errorsOf(
        createPatientProblemSchema.safeParse({
          title: 'Hypertension',
          clinicalStatus: 'active',
          resolvedDate: '2024-01-01',
        })
      )
    ).toContain('Problem resolved date is only allowed when the problem is resolved');
  });

  it('should allow a resolved date when status is resolved', () => {
    expect(
      createPatientProblemSchema.safeParse({
        title: 'Hypertension',
        clinicalStatus: 'resolved',
        resolvedDate: '2024-01-01',
      }).success
    ).toBe(true);
  });

  it('should reject an invalid clinical status', () => {
    expect(
      errorsOf(createPatientProblemSchema.safeParse({ title: 'x', clinicalStatus: 'bogus' }))
    ).toContain('Problem clinical status is invalid');
  });

  it('should validate problem id is positive', () => {
    expect(patientProblemIdSchema.safeParse('1').success).toBe(true);
    expect(patientProblemIdSchema.safeParse('0').success).toBe(false);
  });
});
