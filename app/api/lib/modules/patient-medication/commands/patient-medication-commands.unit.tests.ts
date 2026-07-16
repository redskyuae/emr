import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientMedicationRepository } from '../repository/patient-medication-repository';
import { validateCreatePatientMedication } from '../validator/create-patient-medication-validator';
import { validateUpdatePatientMedication } from '../validator/update-patient-medication-validator';
import { validateDeletePatientMedication } from '../validator/delete-patient-medication-validator';
import { createPatientMedicationCommand } from './create-patient-medication-command';
import { updatePatientMedicationCommand } from './update-patient-medication-command';
import { deletePatientMedicationCommand } from './delete-patient-medication-command';

vi.mock('../repository/patient-medication-repository', () => ({
  patientMedicationRepository: {
    createPatientMedication: vi.fn(),
    updatePatientMedication: vi.fn(),
    deletePatientMedication: vi.fn(),
  },
}));
vi.mock('../validator/create-patient-medication-validator', () => ({
  validateCreatePatientMedication: vi.fn(),
}));
vi.mock('../validator/update-patient-medication-validator', () => ({
  validateUpdatePatientMedication: vi.fn(),
}));
vi.mock('../validator/delete-patient-medication-validator', () => ({
  validateDeletePatientMedication: vi.fn(),
}));

const repo = patientMedicationRepository as typeof patientMedicationRepository & {
  createPatientMedication: Mock<typeof patientMedicationRepository.createPatientMedication>;
  updatePatientMedication: Mock<typeof patientMedicationRepository.updatePatientMedication>;
  deletePatientMedication: Mock<typeof patientMedicationRepository.deletePatientMedication>;
};
const validateCreate = validateCreatePatientMedication as Mock<
  typeof validateCreatePatientMedication
>;
const validateUpdate = validateUpdatePatientMedication as Mock<
  typeof validateUpdatePatientMedication
>;
const validateDelete = validateDeletePatientMedication as Mock<
  typeof validateDeletePatientMedication
>;
const medication = { id: 4, patientId: 1 } as never;

describe('PatientMedication commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { patientId: 1, payload: { drugName: 'Aspirin', status: 'active' } },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 4, payload: { drugName: 'Aspirin', status: 'active' } },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 4, tenantId: 'tenant-1' } });
    repo.createPatientMedication.mockResolvedValue(medication);
    repo.updatePatientMedication.mockResolvedValue(medication);
    repo.deletePatientMedication.mockResolvedValue(medication);
  });

  it('should not write when validation fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['bad'] });
    await createPatientMedicationCommand('1', 'tenant-1', 'user-1', {});
    expect(repo.createPatientMedication).not.toHaveBeenCalled();
  });

  it('should create with provenance', async () => {
    await createPatientMedicationCommand('1', 'tenant-1', 'user-1', {});
    expect(repo.createPatientMedication).toHaveBeenCalledWith({
      drugName: 'Aspirin',
      status: 'active',
      tenantId: 'tenant-1',
      patientId: 1,
      recordedByUserId: 'user-1',
    });
  });

  it('should return success payloads', async () => {
    await expect(createPatientMedicationCommand('1', 'tenant-1', 'user-1', {})).resolves.toEqual({
      success: true,
      data: medication,
    });
    await expect(updatePatientMedicationCommand('4', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: medication,
    });
    await expect(deletePatientMedicationCommand('4', 'tenant-1')).resolves.toEqual({
      success: true,
      data: medication,
    });
  });

  it('should return not-found when update target is missing', async () => {
    repo.updatePatientMedication.mockResolvedValue(undefined);
    await expect(updatePatientMedicationCommand('4', 'tenant-1', {})).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });
});
