import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientAllergyRepository } from '../repository/patient-allergy-repository';
import { getPatientAllergiesQuery } from './get-patient-allergies-query';
import { getPatientAllergyByIdQuery } from './get-patient-allergy-by-id-query';

vi.mock('../repository/patient-allergy-repository', () => ({
  patientAllergyRepository: {
    getPatientAllergies: vi.fn(),
    getPatientAllergyById: vi.fn(),
  },
}));

const repo = patientAllergyRepository as typeof patientAllergyRepository & {
  getPatientAllergies: Mock<typeof patientAllergyRepository.getPatientAllergies>;
  getPatientAllergyById: Mock<typeof patientAllergyRepository.getPatientAllergyById>;
};
const allergy = { id: 10, patientId: 1 } as never;

describe('PatientAllergy queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getPatientAllergies.mockResolvedValue({ data: [allergy], total: 1 });
    repo.getPatientAllergyById.mockResolvedValue(allergy);
  });

  it('should validate list params and not call repository when invalid', async () => {
    await expect(
      getPatientAllergiesQuery({ patientId: 'abc', tenantId: 'tenant-1' })
    ).resolves.toMatchObject({ success: false });
    expect(repo.getPatientAllergies).not.toHaveBeenCalled();
  });

  it('should return the patient allergy list', async () => {
    await expect(
      getPatientAllergiesQuery({ patientId: '1', tenantId: 'tenant-1' })
    ).resolves.toEqual({ success: true, data: [allergy], total: 1 });
    expect(repo.getPatientAllergies).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      patientId: 1,
      page: undefined,
      limit: undefined,
    });
  });

  it('should return a single allergy', async () => {
    await expect(getPatientAllergyByIdQuery('10', 'tenant-1')).resolves.toEqual({
      success: true,
      data: allergy,
    });
  });

  it('should return not-found when the allergy is missing', async () => {
    repo.getPatientAllergyById.mockResolvedValue(undefined);
    await expect(getPatientAllergyByIdQuery('10', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: 404,
    });
  });
});
