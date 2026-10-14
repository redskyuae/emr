import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientTreatmentPlanRepository } from '../repository/patient-treatment-plan-repository';
import { validateAddPatientTreatmentPlanSessions } from '../validator/patient-treatment-plan-validator';
import { addPatientTreatmentPlanSessionsCommand } from './add-patient-treatment-plan-sessions-command';

vi.mock('../repository/patient-treatment-plan-repository', () => ({
  patientTreatmentPlanRepository: { addSessionsToPlan: vi.fn() },
}));
vi.mock('../validator/patient-treatment-plan-validator', () => ({
  validateAddPatientTreatmentPlanSessions: vi.fn(),
}));

const repo = vi.mocked(patientTreatmentPlanRepository);
const validate = vi.mocked(validateAddPatientTreatmentPlanSessions);
const input = {
  patientId: 12,
  tenantId: 'tenant-a',
  patientTreatmentPlanId: 44,
  sessions: 2,
};
const plan = {
  id: 44,
  totalSessions: 5,
  sessions: [{ id: 101 }, { id: 102 }, { id: 103 }, { id: 104 }, { id: 105 }],
};

describe('Patient Treatment Plan commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validate.mockResolvedValue({ success: true, data: input });
    repo.addSessionsToPlan.mockResolvedValue(plan as never);
  });

  it('should short-circuit without writing when add-Sessions validation fails', async () => {
    validate.mockResolvedValue({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Patient Treatment Plan not found'],
    });

    await expect(
      addPatientTreatmentPlanSessionsCommand('12', 'tenant-a', {
        patientTreatmentPlanId: 44,
        sessions: 2,
      })
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Patient Treatment Plan not found'],
    });
    expect(repo.addSessionsToPlan).not.toHaveBeenCalled();
  });

  it('should append Sessions using the normalized validated input', async () => {
    await expect(
      addPatientTreatmentPlanSessionsCommand('12', 'tenant-a', {
        patientTreatmentPlanId: 44,
        sessions: 2,
      })
    ).resolves.toEqual({ success: true, data: plan });
    expect(repo.addSessionsToPlan).toHaveBeenCalledWith(input);
  });

  it('should return a conflict when the Plan becomes unavailable before the write', async () => {
    repo.addSessionsToPlan.mockResolvedValue(undefined);

    await expect(
      addPatientTreatmentPlanSessionsCommand('12', 'tenant-a', {
        patientTreatmentPlanId: 44,
        sessions: 2,
      })
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Patient Treatment Plan is no longer available.'],
    });
  });
});
