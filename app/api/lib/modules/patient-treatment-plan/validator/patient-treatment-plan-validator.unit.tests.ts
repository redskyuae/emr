import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientRepository } from '../../patient/repository/patient-repository';
import { patientTreatmentPlanRepository } from '../repository/patient-treatment-plan-repository';
import {
  validateAddPatientTreatmentPlanSessions,
  validateGetPatientTreatmentPlans,
} from './patient-treatment-plan-validator';

vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../repository/patient-treatment-plan-repository', () => ({
  patientTreatmentPlanRepository: { getCurrentByPatientId: vi.fn() },
}));

const repo = vi.mocked(patientRepository);
const planRepo = vi.mocked(patientTreatmentPlanRepository);
const repeatablePlan = {
  id: 44,
  sessionStructure: 'REPEATABLE' as const,
};

describe('Patient Treatment Plan validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getPatientById.mockResolvedValue({ id: 12 } as never);
    planRepo.getCurrentByPatientId.mockResolvedValue([repeatablePlan] as never);
  });

  it('should reject an invalid Patient ID before reading the repository', async () => {
    await expect(
      validateGetPatientTreatmentPlans('invalid', 'tenant-a', 'current')
    ).resolves.toEqual({
      success: false,
      errors: ['Patient invalid is Invalid.'],
    });
    expect(repo.getPatientById).not.toHaveBeenCalled();
  });

  it('should reject an empty Tenant ID and unsupported status before reading the repository', async () => {
    const result = await validateGetPatientTreatmentPlans('12', ' ', 'completed');

    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining([
        'Tenant ID cannot be empty',
        'Patient Treatment Plan status must be current or all',
      ]),
    });
    expect(repo.getPatientById).not.toHaveBeenCalled();
  });

  it('should return not found when the Patient does not exist in the Tenant', async () => {
    repo.getPatientById.mockResolvedValue(undefined);

    await expect(validateGetPatientTreatmentPlans('12', 'tenant-a', 'current')).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Patient not found'],
    });
    expect(repo.getPatientById).toHaveBeenCalledWith(12, 'tenant-a');
  });

  it('should return normalized Patient, Tenant, and current status when the Patient exists', async () => {
    await expect(validateGetPatientTreatmentPlans('12', ' tenant-a ', 'current')).resolves.toEqual({
      success: true,
      data: { patientId: 12, tenantId: 'tenant-a', status: 'current' },
    });
    expect(repo.getPatientById).toHaveBeenCalledWith(12, 'tenant-a');
  });

  it('accepts all Plan statuses for a Patient journey', async () => {
    await expect(validateGetPatientTreatmentPlans('12', 'tenant-a', 'all')).resolves.toEqual({
      success: true,
      data: { patientId: 12, tenantId: 'tenant-a', status: 'all' },
    });
  });

  it('should reject invalid add-Sessions input before reading repositories', async () => {
    await expect(
      validateAddPatientTreatmentPlanSessions('bad', ' ', {
        patientTreatmentPlanId: 0,
        sessions: 1.5,
      })
    ).resolves.toMatchObject({
      success: false,
      errors: expect.arrayContaining([
        'Patient bad is Invalid.',
        'Tenant ID cannot be empty',
        'Patient Treatment Plan ID must be positive',
        'Sessions must be an integer',
      ]),
    });
    expect(repo.getPatientById).not.toHaveBeenCalled();
    expect(planRepo.getCurrentByPatientId).not.toHaveBeenCalled();
  });

  it('should return not found when adding Sessions for another Patient or Tenant Plan', async () => {
    planRepo.getCurrentByPatientId.mockResolvedValue([]);

    await expect(
      validateAddPatientTreatmentPlanSessions('12', 'tenant-a', {
        patientTreatmentPlanId: 44,
        sessions: 2,
      })
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Patient Treatment Plan not found'],
    });
  });

  it('should normalize valid add-Sessions input for a current Sequenced Plan', async () => {
    planRepo.getCurrentByPatientId.mockResolvedValue([
      { ...repeatablePlan, sessionStructure: 'SEQUENCED' },
    ] as never);

    await expect(
      validateAddPatientTreatmentPlanSessions('12', 'tenant-a', {
        patientTreatmentPlanId: 44,
        sessions: 2,
      })
    ).resolves.toEqual({
      success: true,
      data: {
        patientId: 12,
        tenantId: 'tenant-a',
        patientTreatmentPlanId: 44,
        sessions: 2,
      },
    });
  });

  it('should normalize valid add-Sessions input for a current Repeatable Plan', async () => {
    await expect(
      validateAddPatientTreatmentPlanSessions('12', ' tenant-a ', {
        patientTreatmentPlanId: '44',
        sessions: 2,
      })
    ).resolves.toEqual({
      success: true,
      data: {
        patientId: 12,
        tenantId: 'tenant-a',
        patientTreatmentPlanId: 44,
        sessions: 2,
      },
    });
    expect(planRepo.getCurrentByPatientId).toHaveBeenCalledWith(12, 'tenant-a');
  });
});
