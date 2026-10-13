import { describe, expect, it } from 'vitest';

import {
  formatPatientTreatmentPlanSessionDisplayLabel,
  resequencePatientTreatmentPlanSessionLabel,
} from './patient-treatment-plan-session-label';

describe('Patient Treatment Plan Session labels', () => {
  it('should resequence a copied positioned Session label', () => {
    expect(resequencePatientTreatmentPlanSessionLabel('Session 6 of 6 · Abhyanga', 7, 8)).toBe(
      'Session 7 of 8 · Abhyanga'
    );
  });

  it('should preserve a clinical label that does not encode a Session position', () => {
    expect(resequencePatientTreatmentPlanSessionLabel('Abhyanga Session', 7, 8)).toBe(
      'Abhyanga Session'
    );
  });

  it('should render every card with its current Plan position', () => {
    expect(formatPatientTreatmentPlanSessionDisplayLabel('Abhyanga Session', 7, 8)).toBe(
      'Session 7 of 8 · Abhyanga Session'
    );
    expect(formatPatientTreatmentPlanSessionDisplayLabel('Session 7 of 8 · Abhyanga', 7, 8)).toBe(
      'Session 7 of 8 · Abhyanga'
    );
  });
});
