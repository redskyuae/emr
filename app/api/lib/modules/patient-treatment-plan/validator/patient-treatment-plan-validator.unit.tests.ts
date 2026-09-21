import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientRepository } from '../../patient/repository/patient-repository';
import { validateGetPatientTreatmentPlans } from './patient-treatment-plan-validator';

vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));

const repo = vi.mocked(patientRepository);

describe('Patient Treatment Plan validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getPatientById.mockResolvedValue({ id: 12 } as never);
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
        'Patient Treatment Plan status must be current',
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
});
