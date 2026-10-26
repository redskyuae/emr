import { describe, expect, it } from 'vitest';

import { assignTreatmentPlanFormSchema } from './assign-treatment-plan-form-schema';

describe('assignTreatmentPlanFormSchema', () => {
  it('accepts a selected Treatment and a Patient-specific Session count', () => {
    expect(
      assignTreatmentPlanFormSchema.safeParse({
        treatmentId: '12',
        totalSessions: '5',
        additionalSessions: '0',
      }).success
    ).toBe(true);
  });

  it('rejects missing Treatment and invalid Session counts', () => {
    for (const value of ['0', '1.5', '101']) {
      expect(
        assignTreatmentPlanFormSchema.safeParse({
          treatmentId: '12',
          totalSessions: value,
          additionalSessions: '0',
        }).success
      ).toBe(false);
    }
    expect(
      assignTreatmentPlanFormSchema.safeParse({
        treatmentId: '',
        totalSessions: '',
        additionalSessions: '0',
      }).success
    ).toBe(false);
  });

  it('should accept an optional number of extra Sessions for a Sequenced Treatment', () => {
    expect(
      assignTreatmentPlanFormSchema.safeParse({
        treatmentId: '12',
        totalSessions: '',
        additionalSessions: '2',
      }).success
    ).toBe(true);
    for (const additionalSessions of ['', '-1', '1.5', '101']) {
      expect(
        assignTreatmentPlanFormSchema.safeParse({
          treatmentId: '12',
          totalSessions: '',
          additionalSessions,
        }).success
      ).toBe(false);
    }
  });
});
