import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { allergenRepository } from '../../allergen/repository/allergen-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { patientAllergyRepository } from '../repository/patient-allergy-repository';
import { validateCreatePatientAllergy } from './create-patient-allergy-validator';
import { validateUpdatePatientAllergy } from './update-patient-allergy-validator';
import { validateGetPatientAllergies } from './get-patient-allergies-validator';

vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../../allergen/repository/allergen-repository', () => ({
  allergenRepository: { getAllergenById: vi.fn() },
}));
vi.mock('../repository/patient-allergy-repository', () => ({
  patientAllergyRepository: { getPatientAllergyById: vi.fn() },
}));

const patientRepo = patientRepository as typeof patientRepository & {
  getPatientById: Mock<typeof patientRepository.getPatientById>;
};
const allergenRepo = allergenRepository as typeof allergenRepository & {
  getAllergenById: Mock<typeof allergenRepository.getAllergenById>;
};
const allergyRepo = patientAllergyRepository as typeof patientAllergyRepository & {
  getPatientAllergyById: Mock<typeof patientAllergyRepository.getPatientAllergyById>;
};

describe('PatientAllergy validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientRepo.getPatientById.mockResolvedValue({ id: 1 } as never);
    allergenRepo.getAllergenById.mockResolvedValue({ id: 5 } as never);
    allergyRepo.getPatientAllergyById.mockResolvedValue({ id: 10 } as never);
  });

  it('should return schema errors and skip repository checks when payload is invalid', async () => {
    const result = await validateCreatePatientAllergy('1', 'tenant-1', { severity: 'mild' });
    expect(result.success).toBe(false);
    expect(patientRepo.getPatientById).not.toHaveBeenCalled();
  });

  it('should return not-found when patient does not exist', async () => {
    patientRepo.getPatientById.mockResolvedValue(undefined);
    const result = await validateCreatePatientAllergy('1', 'tenant-1', {
      substance: 'Peanuts',
      severity: 'mild',
    });
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should reject a non-existent allergen reference', async () => {
    allergenRepo.getAllergenById.mockResolvedValue(undefined);
    const result = await validateCreatePatientAllergy('1', 'tenant-1', {
      allergenId: 5,
      severity: 'mild',
    });
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.BAD_REQUEST,
      errors: ['Allergen 5 does not exist.'],
    });
  });

  it('should pass and return parsed data on success', async () => {
    const result = await validateCreatePatientAllergy('1', 'tenant-1', {
      substance: 'Peanuts',
      severity: 'mild',
    });
    expect(result).toMatchObject({
      success: true,
      data: { patientId: 1, payload: { substance: 'Peanuts', severity: 'mild', status: 'active' } },
    });
  });

  it('should return not-found when updating a missing allergy', async () => {
    allergyRepo.getPatientAllergyById.mockResolvedValue(undefined);
    const result = await validateUpdatePatientAllergy(
      '10',
      { substance: 'Peanuts', severity: 'mild' },
      'tenant-1'
    );
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should validate list params', () => {
    expect(validateGetPatientAllergies('1', 'tenant-1')).toMatchObject({ success: true });
    expect(validateGetPatientAllergies('abc', 'tenant-1')).toMatchObject({ success: false });
  });
});
