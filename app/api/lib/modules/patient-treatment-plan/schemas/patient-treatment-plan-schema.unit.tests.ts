import { describe, expect, it } from 'vitest';

import {
  assignPatientTreatmentPlanSchema,
  patientTreatmentPlanIdSchema,
  patientTreatmentPlanPatientIdSchema,
  patientTreatmentPlanSessionIdSchema,
  patientTreatmentPlanSessionSchema,
  patientTreatmentPlanTenantIdSchema,
} from './patient-treatment-plan-schema';

describe('Patient Treatment Plan schema', () => {
  it('should accept a Repeatable assignment with a positive count beyond twelve', () => {
    expect(
      assignPatientTreatmentPlanSchema.parse({
        patientId: 1,
        treatmentId: 2,
        sessionStructure: 'REPEATABLE',
        totalSessions: 30,
      })
    ).toMatchObject({ totalSessions: 30 });
    for (const totalSessions of [undefined, null, 0, -1, 1.5]) {
      expect(
        assignPatientTreatmentPlanSchema.safeParse({
          patientId: 1,
          treatmentId: 2,
          sessionStructure: 'REPEATABLE',
          totalSessions,
        }).success
      ).toBe(false);
    }
  });

  it('should reject caller-supplied counts for Sequenced assignments', () => {
    const input = { patientId: 1, treatmentId: 2, sessionStructure: 'SEQUENCED' };
    expect(assignPatientTreatmentPlanSchema.safeParse(input).success).toBe(true);
    expect(assignPatientTreatmentPlanSchema.safeParse({ ...input, totalSessions: 2 }).success).toBe(
      false
    );
    expect(
      assignPatientTreatmentPlanSchema.safeParse({ ...input, sessionStructure: 'OTHER' }).success
    ).toBe(false);
  });

  it('should validate positive patient, Plan and Session IDs and a non-empty Tenant', () => {
    for (const schema of [
      patientTreatmentPlanIdSchema,
      patientTreatmentPlanPatientIdSchema,
      patientTreatmentPlanSessionIdSchema,
    ]) {
      for (const invalid of [0, -1, 1.5, null, ''])
        expect(schema.safeParse(invalid).success).toBe(false);
      expect(schema.parse('12')).toBe(12);
    }
    expect(patientTreatmentPlanTenantIdSchema.safeParse(' ').success).toBe(false);
    expect(patientTreatmentPlanTenantIdSchema.parse(' tenant-a ')).toBe('tenant-a');
  });

  it('should preserve nullable historical Session metadata in responses', () => {
    const session = {
      id: 1,
      tenantId: 'tenant-a',
      patientTreatmentPlanId: 2,
      treatmentSessionId: null,
      sessionNumber: 20,
      label: null,
      procedure: null,
      durationMinutes: null,
      setupMinutes: null,
      cleaningMinutes: null,
      preparation: null,
      warning: null,
      equipment: null,
      roomType: null,
      therapistSkill: null,
      legacyConductionNote: null,
      completionStatus: 'COMPLETED',
      completionSource: 'LEGACY_IMPORT',
      completedVisitId: null,
      completedAt: null,
      createdOn: new Date(),
      modifiedOn: new Date(),
    };
    expect(patientTreatmentPlanSessionSchema.parse(session)).toEqual(session);
  });
});
