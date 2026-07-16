import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clinicalNoteRepository } from '../../clinical-note/repository/clinical-note-repository';
import { patientAllergyRepository } from '../../patient-allergy/repository/patient-allergy-repository';
import { patientMedicationRepository } from '../../patient-medication/repository/patient-medication-repository';
import { patientProblemRepository } from '../../patient-problem/repository/patient-problem-repository';
import { patientVitalSignRepository } from '../../patient-vital-sign/repository/patient-vital-sign-repository';
import { validateGetPatientChart } from '../validator/get-patient-chart-validator';
import { getPatientChartQuery } from './get-patient-chart-query';

vi.mock('../validator/get-patient-chart-validator', () => ({
  validateGetPatientChart: vi.fn(),
}));
vi.mock('../../patient-allergy/repository/patient-allergy-repository', () => ({
  patientAllergyRepository: { getPatientAllergies: vi.fn() },
}));
vi.mock('../../patient-problem/repository/patient-problem-repository', () => ({
  patientProblemRepository: { getPatientProblems: vi.fn() },
}));
vi.mock('../../patient-vital-sign/repository/patient-vital-sign-repository', () => ({
  patientVitalSignRepository: { getPatientVitalSigns: vi.fn() },
}));
vi.mock('../../patient-medication/repository/patient-medication-repository', () => ({
  patientMedicationRepository: { getPatientMedications: vi.fn() },
}));
vi.mock('../../clinical-note/repository/clinical-note-repository', () => ({
  clinicalNoteRepository: { getClinicalNotes: vi.fn() },
}));

const validate = validateGetPatientChart as Mock<typeof validateGetPatientChart>;
const allergyRepo = patientAllergyRepository as typeof patientAllergyRepository & {
  getPatientAllergies: Mock<typeof patientAllergyRepository.getPatientAllergies>;
};
const problemRepo = patientProblemRepository as typeof patientProblemRepository & {
  getPatientProblems: Mock<typeof patientProblemRepository.getPatientProblems>;
};
const vitalRepo = patientVitalSignRepository as typeof patientVitalSignRepository & {
  getPatientVitalSigns: Mock<typeof patientVitalSignRepository.getPatientVitalSigns>;
};
const medicationRepo = patientMedicationRepository as typeof patientMedicationRepository & {
  getPatientMedications: Mock<typeof patientMedicationRepository.getPatientMedications>;
};
const noteRepo = clinicalNoteRepository as typeof clinicalNoteRepository & {
  getClinicalNotes: Mock<typeof clinicalNoteRepository.getClinicalNotes>;
};

describe('PatientChart query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validate.mockResolvedValue({ success: true, data: { patientId: 1, tenantId: 'tenant-1' } });
    allergyRepo.getPatientAllergies.mockResolvedValue({ data: [{ id: 7 }] as never, total: 1 });
    problemRepo.getPatientProblems.mockResolvedValue({ data: [{ id: 3 }] as never, total: 1 });
    vitalRepo.getPatientVitalSigns.mockResolvedValue({ data: [{ id: 15 }] as never, total: 1 });
    medicationRepo.getPatientMedications.mockResolvedValue({
      data: [{ id: 21 }] as never,
      total: 1,
    });
    noteRepo.getClinicalNotes.mockResolvedValue({ data: [{ id: 31 }] as never, total: 1 });
  });

  it('should not call repositories when validation fails', async () => {
    validate.mockResolvedValue({ success: false, errors: ['bad'] });
    const result = await getPatientChartQuery('abc', 'tenant-1');
    expect(result).toMatchObject({ success: false });
    expect(allergyRepo.getPatientAllergies).not.toHaveBeenCalled();
    expect(noteRepo.getClinicalNotes).not.toHaveBeenCalled();
  });

  it('should aggregate all five record collections', async () => {
    const result = await getPatientChartQuery('1', 'tenant-1');
    expect(result).toEqual({
      success: true,
      data: {
        allergies: [{ id: 7 }],
        problems: [{ id: 3 }],
        vitalSigns: [{ id: 15 }],
        medications: [{ id: 21 }],
        clinicalNotes: [{ id: 31 }],
      },
    });
  });
});
