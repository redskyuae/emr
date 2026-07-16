import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientRepository } from '../../patient/repository/patient-repository';
import { patientMedicationRepository } from '../repository/patient-medication-repository';
import { validateCreatePatientMedication } from './create-patient-medication-validator';
import { validateUpdatePatientMedication } from './update-patient-medication-validator';

vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../repository/patient-medication-repository', () => ({
  patientMedicationRepository: { getPatientMedicationById: vi.fn() },
}));

const patientRepo = patientRepository as typeof patientRepository & {
  getPatientById: Mock<typeof patientRepository.getPatientById>;
};
const medRepo = patientMedicationRepository as typeof patientMedicationRepository & {
  getPatientMedicationById: Mock<typeof patientMedicationRepository.getPatientMedicationById>;
};

describe('PatientMedication validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientRepo.getPatientById.mockResolvedValue({ id: 1 } as never);
    medRepo.getPatientMedicationById.mockResolvedValue({ id: 4, patientId: 1 } as never);
  });

  it('should skip patient checks when the payload is invalid', async () => {
    const result = await validateCreatePatientMedication('1', 'tenant-1', {});
    expect(result.success).toBe(false);
    expect(patientRepo.getPatientById).not.toHaveBeenCalled();
  });

  it('should return not-found when patient is missing', async () => {
    patientRepo.getPatientById.mockResolvedValue(undefined);
    const result = await validateCreatePatientMedication('1', 'tenant-1', { drugName: 'Aspirin' });
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should pass on a valid create', async () => {
    const result = await validateCreatePatientMedication('1', 'tenant-1', { drugName: 'Aspirin' });
    expect(result).toMatchObject({
      success: true,
      data: { patientId: 1, payload: { drugName: 'Aspirin', status: 'active' } },
    });
  });

  it('should return not-found when updating a missing medication', async () => {
    medRepo.getPatientMedicationById.mockResolvedValue(undefined);
    const result = await validateUpdatePatientMedication('4', { drugName: 'Aspirin' }, 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });
});
