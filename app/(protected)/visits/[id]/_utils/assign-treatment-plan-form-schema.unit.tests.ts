import { describe, expect, it } from 'vitest';

import { assignTreatmentPlanFormSchema } from './assign-treatment-plan-form-schema';

describe('assignTreatmentPlanFormSchema', () => {
  it('accepts a selected Treatment and a Patient-specific Session count', () => {
    expect(
      assignTreatmentPlanFormSchema.safeParse({ treatmentId: '12', totalSessions: '5' }).success
    ).toBe(true);
  });

  it('rejects missing Treatment and invalid Session counts', () => {
    for (const value of ['0', '1.5', '101']) {
      expect(
        assignTreatmentPlanFormSchema.safeParse({ treatmentId: '12', totalSessions: value }).success
      ).toBe(false);
    }
    expect(
      assignTreatmentPlanFormSchema.safeParse({ treatmentId: '', totalSessions: '' }).success
    ).toBe(false);
  });
});
