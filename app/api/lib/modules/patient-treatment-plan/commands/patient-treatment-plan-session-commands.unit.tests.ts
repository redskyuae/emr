import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientTreatmentPlanRepository } from '../repository/patient-treatment-plan-repository';
import {
  validateStartPatientTreatmentPlanSession,
  validateUpdatePatientTreatmentPlanSession,
} from '../validator/patient-treatment-plan-session-validator';
import { startPatientTreatmentPlanSessionCommand } from './start-patient-treatment-plan-session-command';
import { updatePatientTreatmentPlanSessionCommand } from './update-patient-treatment-plan-session-command';

vi.mock('../repository/patient-treatment-plan-repository', () => ({
  patientTreatmentPlanRepository: { startSession: vi.fn(), updateSessionPlan: vi.fn() },
}));
vi.mock('../validator/patient-treatment-plan-session-validator', () => ({
  validateStartPatientTreatmentPlanSession: vi.fn(),
  validateUpdatePatientTreatmentPlanSession: vi.fn(),
}));

const repo = vi.mocked(patientTreatmentPlanRepository);
const validateStart = vi.mocked(validateStartPatientTreatmentPlanSession);
const validateUpdate = vi.mocked(validateUpdatePatientTreatmentPlanSession);

const params = {
  patientId: '12',
  tenantId: 'tenant-a',
  patientTreatmentPlanId: '44',
  patientTreatmentPlanSessionId: '102',
};
const target = {
  patientId: 12,
  tenantId: 'tenant-a',
  patientTreatmentPlanId: 44,
  patientTreatmentPlanSessionId: 102,
};
const plan = { id: 44, sessions: [{ id: 102, startedVisitId: 5120 }] };
const notFound = {
  success: false as const,
  status: StatusCodes.NOT_FOUND,
  errors: ['Patient Treatment Plan Session not found'],
};
const unavailable = {
  success: false,
  status: StatusCodes.CONFLICT,
  errors: ['Patient Treatment Plan Session is no longer available.'],
};

describe('Patient Treatment Plan Session commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateUpdate.mockResolvedValue({
      success: true,
      data: { ...target, plan: { warning: 'Avoid the left knee.' } },
    });
    validateStart.mockResolvedValue({ success: true, data: { ...target, visitId: 5120 } });
    repo.updateSessionPlan.mockResolvedValue(plan as never);
    repo.startSession.mockResolvedValue(plan as never);
  });

  describe('updatePatientTreatmentPlanSessionCommand', () => {
    it('should not write when validation fails', async () => {
      validateUpdate.mockResolvedValue(notFound);

      await expect(
        updatePatientTreatmentPlanSessionCommand(params, { warning: 'x' })
      ).resolves.toEqual(notFound);
      expect(validateUpdate).toHaveBeenCalledWith(params, { warning: 'x' });
      expect(repo.updateSessionPlan).not.toHaveBeenCalled();
    });

    it('should update the Session plan with the validated input', async () => {
      await expect(
        updatePatientTreatmentPlanSessionCommand(params, { warning: ' Avoid the left knee. ' })
      ).resolves.toEqual({ success: true, data: plan });
      expect(repo.updateSessionPlan).toHaveBeenCalledWith({
        ...target,
        plan: { warning: 'Avoid the left knee.' },
      });
    });

    it('should return a conflict when the Session changed before the write', async () => {
      repo.updateSessionPlan.mockResolvedValue(undefined);

      await expect(
        updatePatientTreatmentPlanSessionCommand(params, { warning: 'x' })
      ).resolves.toEqual(unavailable);
    });
  });

  describe('startPatientTreatmentPlanSessionCommand', () => {
    it('should not write when validation fails', async () => {
      validateStart.mockResolvedValue(notFound);

      await expect(
        startPatientTreatmentPlanSessionCommand(params, { visitId: 5120 })
      ).resolves.toEqual(notFound);
      expect(repo.startSession).not.toHaveBeenCalled();
    });

    it('should start the Session in the validated Visit', async () => {
      await expect(
        startPatientTreatmentPlanSessionCommand(params, { visitId: '5120' })
      ).resolves.toEqual({ success: true, data: plan });
      expect(validateStart).toHaveBeenCalledWith(params, { visitId: '5120' });
      expect(repo.startSession).toHaveBeenCalledWith({ ...target, visitId: 5120 });
    });

    it('should return a conflict when the Session was started or completed concurrently', async () => {
      repo.startSession.mockResolvedValue(undefined);

      await expect(
        startPatientTreatmentPlanSessionCommand(params, { visitId: 5120 })
      ).resolves.toEqual(unavailable);
    });

    it('should map the one-Session-per-Plan-per-Visit index violation to a conflict', async () => {
      repo.startSession.mockRejectedValue({
        cause: {
          code: '23505',
          constraint: 'patient_treatment_plan_session_tenant_plan_started_visit_idx',
        },
      });

      await expect(
        startPatientTreatmentPlanSessionCommand(params, { visitId: 5120 })
      ).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['This Visit already has a Session of this Patient Treatment Plan.'],
      });
    });

    it('should rethrow unexpected database errors', async () => {
      const error = new Error('connection lost');
      repo.startSession.mockRejectedValue(error);

      await expect(startPatientTreatmentPlanSessionCommand(params, { visitId: 5120 })).rejects.toBe(
        error
      );
    });
  });
});
