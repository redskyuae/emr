import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientVitalSignRepository } from '../repository/patient-vital-sign-repository';
import { validateCreatePatientVitalSign } from '../validator/create-patient-vital-sign-validator';
import { validateUpdatePatientVitalSign } from '../validator/update-patient-vital-sign-validator';
import { validateDeletePatientVitalSign } from '../validator/delete-patient-vital-sign-validator';
import { createPatientVitalSignCommand } from './create-patient-vital-sign-command';
import { updatePatientVitalSignCommand } from './update-patient-vital-sign-command';
import { deletePatientVitalSignCommand } from './delete-patient-vital-sign-command';

vi.mock('../repository/patient-vital-sign-repository', () => ({
  patientVitalSignRepository: {
    createPatientVitalSign: vi.fn(),
    updatePatientVitalSign: vi.fn(),
    deletePatientVitalSign: vi.fn(),
  },
}));
vi.mock('../validator/create-patient-vital-sign-validator', () => ({
  validateCreatePatientVitalSign: vi.fn(),
}));
vi.mock('../validator/update-patient-vital-sign-validator', () => ({
  validateUpdatePatientVitalSign: vi.fn(),
}));
vi.mock('../validator/delete-patient-vital-sign-validator', () => ({
  validateDeletePatientVitalSign: vi.fn(),
}));

const repo = patientVitalSignRepository as typeof patientVitalSignRepository & {
  createPatientVitalSign: Mock<typeof patientVitalSignRepository.createPatientVitalSign>;
  updatePatientVitalSign: Mock<typeof patientVitalSignRepository.updatePatientVitalSign>;
  deletePatientVitalSign: Mock<typeof patientVitalSignRepository.deletePatientVitalSign>;
};
const validateCreate = validateCreatePatientVitalSign as Mock<
  typeof validateCreatePatientVitalSign
>;
const validateUpdate = validateUpdatePatientVitalSign as Mock<
  typeof validateUpdatePatientVitalSign
>;
const validateDelete = validateDeletePatientVitalSign as Mock<
  typeof validateDeletePatientVitalSign
>;
const vitalSign = { id: 4, patientId: 1 } as never;

describe('PatientVitalSign commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { patientId: 1, payload: { heightCm: 170, weightKg: 70 } },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 4, payload: { pulseBpm: 72 } },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 4, tenantId: 'tenant-1' } });
    repo.createPatientVitalSign.mockResolvedValue(vitalSign);
    repo.updatePatientVitalSign.mockResolvedValue(vitalSign);
    repo.deletePatientVitalSign.mockResolvedValue(vitalSign);
  });

  it('should not write when validation fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['bad'] });
    await createPatientVitalSignCommand('1', 'tenant-1', 'user-1', {});
    expect(repo.createPatientVitalSign).not.toHaveBeenCalled();
  });

  it('should compute BMI and create with provenance', async () => {
    await createPatientVitalSignCommand('1', 'tenant-1', 'user-1', {});
    expect(repo.createPatientVitalSign).toHaveBeenCalledWith({
      heightCm: 170,
      weightKg: 70,
      bmi: 24.2,
      tenantId: 'tenant-1',
      patientId: 1,
      recordedByUserId: 'user-1',
    });
  });

  it('should return success payloads', async () => {
    await expect(createPatientVitalSignCommand('1', 'tenant-1', 'user-1', {})).resolves.toEqual({
      success: true,
      data: vitalSign,
    });
    await expect(updatePatientVitalSignCommand('4', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: vitalSign,
    });
    await expect(deletePatientVitalSignCommand('4', 'tenant-1')).resolves.toEqual({
      success: true,
      data: vitalSign,
    });
  });

  it('should return not-found when update target is missing', async () => {
    repo.updatePatientVitalSign.mockResolvedValue(undefined);
    await expect(updatePatientVitalSignCommand('4', 'tenant-1', {})).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });
});
