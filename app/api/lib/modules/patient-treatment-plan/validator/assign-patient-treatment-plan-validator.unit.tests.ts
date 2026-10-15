import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientRepository } from '../../patient/repository/patient-repository';
import { treatmentRepository } from '../../treatment/repository/treatment-repository';
import { validateAssignPatientTreatmentPlan } from './assign-patient-treatment-plan-validator';

vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../../treatment/repository/treatment-repository', () => ({
  treatmentRepository: { getTreatmentById: vi.fn() },
}));

const patients = vi.mocked(patientRepository);
const treatments = vi.mocked(treatmentRepository);

describe('validateAssignPatientTreatmentPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patients.getPatientById.mockResolvedValue({
      id: 7,
      registrationStatus: 'registered',
      isActive: true,
    } as never);
    treatments.getTreatmentById.mockResolvedValue({
      id: 11,
      sessionStructure: 'REPEATABLE',
      sessions: [{ id: 1 }],
    } as never);
  });

  it('rejects malformed input without reading other Tenant records', async () => {
    const result = await validateAssignPatientTreatmentPlan('bad', ' ', { treatmentId: 0 });
    expect(result.success).toBe(false);
    expect(patients.getPatientById).not.toHaveBeenCalled();
  });

  it('requires a registered Patient in the active Tenant', async () => {
    patients.getPatientById.mockResolvedValue({
      id: 7,
      registrationStatus: 'provisional',
    } as never);
    await expect(
      validateAssignPatientTreatmentPlan('7', 'tenant-a', { treatmentId: 11, totalSessions: 5 })
    ).resolves.toMatchObject({
      success: false,
      status: 409,
    });
    expect(patients.getPatientById).toHaveBeenCalledWith(7, 'tenant-a');
  });

  it('rejects an inactive Patient', async () => {
    patients.getPatientById.mockResolvedValue({
      id: 7,
      registrationStatus: 'registered',
      isActive: false,
    } as never);
    await expect(
      validateAssignPatientTreatmentPlan('7', 'tenant-a', { treatmentId: 11, totalSessions: 5 })
    ).resolves.toMatchObject({
      success: false,
      status: 409,
      errors: ['Patient is inactive and cannot be assigned a Treatment Plan.'],
    });
  });

  it('requires a Session count for Repeatable Treatments', async () => {
    await expect(
      validateAssignPatientTreatmentPlan('7', 'tenant-a', { treatmentId: 11 })
    ).resolves.toMatchObject({
      success: false,
      errors: ['Number of Sessions is required for a Repeatable Treatment.'],
    });
  });

  it('derives the Session count for Sequenced Treatments', async () => {
    treatments.getTreatmentById.mockResolvedValue({
      id: 11,
      sessionStructure: 'SEQUENCED',
      sessions: [{ id: 1 }, { id: 2 }],
    } as never);
    await expect(
      validateAssignPatientTreatmentPlan('7', 'tenant-a', { treatmentId: 11 })
    ).resolves.toEqual({
      success: true,
      data: { tenantId: 'tenant-a', patientId: 7, treatmentId: 11, totalSessions: undefined },
    });
  });

  it('rejects cross-Tenant or deleted Treatments', async () => {
    treatments.getTreatmentById.mockResolvedValue(undefined);
    await expect(
      validateAssignPatientTreatmentPlan('7', 'tenant-a', { treatmentId: 11, totalSessions: 5 })
    ).resolves.toMatchObject({
      success: false,
      status: 404,
      errors: ['Treatment not found'],
    });
    expect(treatments.getTreatmentById).toHaveBeenCalledWith(11, 'tenant-a');
  });
});
