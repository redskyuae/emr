import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientTreatmentPlanRepository } from '../repository/patient-treatment-plan-repository';
import { validateAssignPatientTreatmentPlan } from '../validator/assign-patient-treatment-plan-validator';
import { assignPatientTreatmentPlanCommand } from './assign-patient-treatment-plan-command';

vi.mock('../repository/patient-treatment-plan-repository', () => ({
  patientTreatmentPlanRepository: { assignTreatmentToPatient: vi.fn() },
}));
vi.mock('../validator/assign-patient-treatment-plan-validator', () => ({
  validateAssignPatientTreatmentPlan: vi.fn(),
}));

const repo = vi.mocked(patientTreatmentPlanRepository);
const validate = vi.mocked(validateAssignPatientTreatmentPlan);

describe('assignPatientTreatmentPlanCommand', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not write when validation fails', async () => {
    validate.mockResolvedValue({ success: false, errors: ['Treatment not found'], status: 404 });
    await expect(
      assignPatientTreatmentPlanCommand('7', 'tenant-a', { treatmentId: 11 })
    ).resolves.toMatchObject({ success: false, status: 404 });
    expect(repo.assignTreatmentToPatient).not.toHaveBeenCalled();
  });

  it('creates a Patient Treatment Plan from validated input', async () => {
    const data = { tenantId: 'tenant-a', patientId: 7, treatmentId: 11, totalSessions: 5 };
    validate.mockResolvedValue({ success: true, data });
    repo.assignTreatmentToPatient.mockResolvedValue({ id: 21 } as never);
    await expect(
      assignPatientTreatmentPlanCommand('7', 'tenant-a', { treatmentId: 11, totalSessions: 5 })
    ).resolves.toMatchObject({ success: true, data: { id: 21 } });
    expect(repo.assignTreatmentToPatient).toHaveBeenCalledWith(data);
  });

  it('should pass additional Sequenced Sessions into the same assignment', async () => {
    const data = {
      tenantId: 'tenant-a',
      patientId: 7,
      treatmentId: 11,
      additionalSessions: 2,
    };
    validate.mockResolvedValue({ success: true, data });
    repo.assignTreatmentToPatient.mockResolvedValue({ id: 22, totalSessions: 4 } as never);

    await expect(
      assignPatientTreatmentPlanCommand('7', 'tenant-a', {
        treatmentId: 11,
        additionalSessions: 2,
      })
    ).resolves.toMatchObject({ success: true, data: { totalSessions: 4 } });
    expect(repo.assignTreatmentToPatient).toHaveBeenCalledWith(data);
  });
});
