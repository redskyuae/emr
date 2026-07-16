import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientMedicationRepository } from '../repository/patient-medication-repository';
import { getPatientMedicationsQuery } from './get-patient-medications-query';
import { getPatientMedicationByIdQuery } from './get-patient-medication-by-id-query';

vi.mock('../repository/patient-medication-repository', () => ({
  patientMedicationRepository: {
    getPatientMedications: vi.fn(),
    getPatientMedicationById: vi.fn(),
  },
}));

const repo = patientMedicationRepository as typeof patientMedicationRepository & {
  getPatientMedications: Mock<typeof patientMedicationRepository.getPatientMedications>;
  getPatientMedicationById: Mock<typeof patientMedicationRepository.getPatientMedicationById>;
};
const medication = { id: 4, patientId: 1 } as never;

describe('PatientMedication queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getPatientMedications.mockResolvedValue({ data: [medication], total: 1 });
    repo.getPatientMedicationById.mockResolvedValue(medication);
  });

  it('should not call repository when list validation fails', async () => {
    await expect(
      getPatientMedicationsQuery({ patientId: 'abc', tenantId: 'tenant-1' })
    ).resolves.toMatchObject({ success: false });
    expect(repo.getPatientMedications).not.toHaveBeenCalled();
  });

  it('should return the medication list', async () => {
    await expect(
      getPatientMedicationsQuery({ patientId: '1', tenantId: 'tenant-1' })
    ).resolves.toEqual({ success: true, data: [medication], total: 1 });
  });

  it('should return a single medication', async () => {
    await expect(getPatientMedicationByIdQuery('4', 'tenant-1')).resolves.toEqual({
      success: true,
      data: medication,
    });
  });

  it('should return not-found when the medication is missing', async () => {
    repo.getPatientMedicationById.mockResolvedValue(undefined);
    await expect(getPatientMedicationByIdQuery('4', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: 404,
    });
  });
});
