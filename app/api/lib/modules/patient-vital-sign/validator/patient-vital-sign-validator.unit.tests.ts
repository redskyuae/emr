import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientRepository } from '../../patient/repository/patient-repository';
import { patientVitalSignRepository } from '../repository/patient-vital-sign-repository';
import { validateCreatePatientVitalSign } from './create-patient-vital-sign-validator';
import { validateUpdatePatientVitalSign } from './update-patient-vital-sign-validator';

vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../repository/patient-vital-sign-repository', () => ({
  patientVitalSignRepository: { getPatientVitalSignById: vi.fn() },
}));

const patientRepo = patientRepository as typeof patientRepository & {
  getPatientById: Mock<typeof patientRepository.getPatientById>;
};
const vitalRepo = patientVitalSignRepository as typeof patientVitalSignRepository & {
  getPatientVitalSignById: Mock<typeof patientVitalSignRepository.getPatientVitalSignById>;
};

describe('PatientVitalSign validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientRepo.getPatientById.mockResolvedValue({ id: 1 } as never);
    vitalRepo.getPatientVitalSignById.mockResolvedValue({ id: 4, patientId: 1 } as never);
  });

  it('should skip patient checks when the payload is invalid', async () => {
    const result = await validateCreatePatientVitalSign('1', 'tenant-1', {});
    expect(result.success).toBe(false);
    expect(patientRepo.getPatientById).not.toHaveBeenCalled();
  });

  it('should return not-found when patient is missing', async () => {
    patientRepo.getPatientById.mockResolvedValue(undefined);
    const result = await validateCreatePatientVitalSign('1', 'tenant-1', { pulseBpm: 72 });
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should pass on a valid create', async () => {
    const result = await validateCreatePatientVitalSign('1', 'tenant-1', { pulseBpm: 72 });
    expect(result).toMatchObject({
      success: true,
      data: { patientId: 1, payload: { pulseBpm: 72 } },
    });
  });

  it('should return not-found when updating a missing vital sign', async () => {
    vitalRepo.getPatientVitalSignById.mockResolvedValue(undefined);
    const result = await validateUpdatePatientVitalSign('4', { pulseBpm: 72 }, 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });
});
