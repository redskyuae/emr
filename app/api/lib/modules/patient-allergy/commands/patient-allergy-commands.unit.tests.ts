import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientAllergyRepository } from '../repository/patient-allergy-repository';
import { validateCreatePatientAllergy } from '../validator/create-patient-allergy-validator';
import { validateUpdatePatientAllergy } from '../validator/update-patient-allergy-validator';
import { validateDeletePatientAllergy } from '../validator/delete-patient-allergy-validator';
import { createPatientAllergyCommand } from './create-patient-allergy-command';
import { updatePatientAllergyCommand } from './update-patient-allergy-command';
import { deletePatientAllergyCommand } from './delete-patient-allergy-command';

vi.mock('../repository/patient-allergy-repository', () => ({
  patientAllergyRepository: {
    createPatientAllergy: vi.fn(),
    updatePatientAllergy: vi.fn(),
    deletePatientAllergy: vi.fn(),
  },
}));
vi.mock('../validator/create-patient-allergy-validator', () => ({
  validateCreatePatientAllergy: vi.fn(),
}));
vi.mock('../validator/update-patient-allergy-validator', () => ({
  validateUpdatePatientAllergy: vi.fn(),
}));
vi.mock('../validator/delete-patient-allergy-validator', () => ({
  validateDeletePatientAllergy: vi.fn(),
}));

const repo = patientAllergyRepository as typeof patientAllergyRepository & {
  createPatientAllergy: Mock<typeof patientAllergyRepository.createPatientAllergy>;
  updatePatientAllergy: Mock<typeof patientAllergyRepository.updatePatientAllergy>;
  deletePatientAllergy: Mock<typeof patientAllergyRepository.deletePatientAllergy>;
};
const validateCreate = validateCreatePatientAllergy as Mock<typeof validateCreatePatientAllergy>;
const validateUpdate = validateUpdatePatientAllergy as Mock<typeof validateUpdatePatientAllergy>;
const validateDelete = validateDeletePatientAllergy as Mock<typeof validateDeletePatientAllergy>;
const allergy = { id: 10, patientId: 1 } as never;

describe('PatientAllergy commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { patientId: 1, payload: { substance: 'Peanuts', severity: 'mild', status: 'active' } },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 10, payload: { substance: 'Peanuts', severity: 'mild', status: 'active' } },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 10, tenantId: 'tenant-1' } });
    repo.createPatientAllergy.mockResolvedValue(allergy);
    repo.updatePatientAllergy.mockResolvedValue(allergy);
    repo.deletePatientAllergy.mockResolvedValue(allergy);
  });

  it('should not write when validation fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['bad'] });
    const result = await createPatientAllergyCommand('1', 'tenant-1', 'user-1', {});
    expect(result).toEqual({ success: false, errors: ['bad'], status: undefined });
    expect(repo.createPatientAllergy).not.toHaveBeenCalled();
  });

  it('should create with tenant, patient, and recorder provenance', async () => {
    await createPatientAllergyCommand('1', 'tenant-1', 'user-1', {});
    expect(repo.createPatientAllergy).toHaveBeenCalledWith({
      substance: 'Peanuts',
      severity: 'mild',
      status: 'active',
      tenantId: 'tenant-1',
      patientId: 1,
      recordedByUserId: 'user-1',
    });
  });

  it('should return success payloads', async () => {
    await expect(createPatientAllergyCommand('1', 'tenant-1', 'user-1', {})).resolves.toEqual({
      success: true,
      data: allergy,
    });
    await expect(updatePatientAllergyCommand('10', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: allergy,
    });
    await expect(deletePatientAllergyCommand('10', 'tenant-1')).resolves.toEqual({
      success: true,
      data: allergy,
    });
  });

  it('should return not-found when update target is missing', async () => {
    repo.updatePatientAllergy.mockResolvedValue(undefined);
    await expect(updatePatientAllergyCommand('10', 'tenant-1', {})).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });
});
