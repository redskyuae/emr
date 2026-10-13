import { describe, expect, it } from 'vitest';

import { addTreatmentPlanSessionsFormSchema } from './add-treatment-plan-sessions-form-schema';

describe('Add Treatment Plan Sessions form schema', () => {
  it('should transform selected Plan and Session count strings into numbers', () => {
    expect(
      addTreatmentPlanSessionsFormSchema.parse({ patientTreatmentPlanId: '44', sessions: '2' })
    ).toEqual({ patientTreatmentPlanId: 44, sessions: 2 });
  });

  it('should require a Plan and a positive integer Session count', () => {
    for (const payload of [
      { patientTreatmentPlanId: '', sessions: '2' },
      { patientTreatmentPlanId: '44', sessions: '' },
      { patientTreatmentPlanId: '44', sessions: '0' },
      { patientTreatmentPlanId: '44', sessions: '1.5' },
    ]) {
      expect(addTreatmentPlanSessionsFormSchema.safeParse(payload).success).toBe(false);
    }
  });
});
