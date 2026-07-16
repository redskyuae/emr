import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { diagnosisCodeRepository } from '../../diagnosis-code/repository/diagnosis-code-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { patientProblemRepository } from '../repository/patient-problem-repository';
import { validateCreatePatientProblem } from './create-patient-problem-validator';
import { validateUpdatePatientProblem } from './update-patient-problem-validator';

vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../../diagnosis-code/repository/diagnosis-code-repository', () => ({
  diagnosisCodeRepository: { getDiagnosisCodeById: vi.fn() },
}));
vi.mock('../repository/patient-problem-repository', () => ({
  patientProblemRepository: { getPatientProblemById: vi.fn() },
}));

const patientRepo = patientRepository as typeof patientRepository & {
  getPatientById: Mock<typeof patientRepository.getPatientById>;
};
const codeRepo = diagnosisCodeRepository as typeof diagnosisCodeRepository & {
  getDiagnosisCodeById: Mock<typeof diagnosisCodeRepository.getDiagnosisCodeById>;
};
const problemRepo = patientProblemRepository as typeof patientProblemRepository & {
  getPatientProblemById: Mock<typeof patientProblemRepository.getPatientProblemById>;
};

describe('PatientProblem validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientRepo.getPatientById.mockResolvedValue({ id: 1 } as never);
    codeRepo.getDiagnosisCodeById.mockResolvedValue({ id: 7, title: 'Essential hypertension' } as never);
    problemRepo.getPatientProblemById.mockResolvedValue({ id: 9, patientId: 1 } as never);
  });

  it('should default the title from the diagnosis code when title is omitted', async () => {
    const result = await validateCreatePatientProblem('1', 'tenant-1', { diagnosisCodeId: 7 });
    expect(result).toMatchObject({
      success: true,
      data: { patientId: 1, payload: { title: 'Essential hypertension' } },
    });
  });

  it('should reject a non-existent diagnosis code', async () => {
    codeRepo.getDiagnosisCodeById.mockResolvedValue(undefined);
    const result = await validateCreatePatientProblem('1', 'tenant-1', { diagnosisCodeId: 7 });
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.BAD_REQUEST,
      errors: ['Diagnosis code 7 does not exist.'],
    });
  });

  it('should return not-found when patient is missing', async () => {
    patientRepo.getPatientById.mockResolvedValue(undefined);
    const result = await validateCreatePatientProblem('1', 'tenant-1', { title: 'Asthma' });
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return not-found when updating a missing problem', async () => {
    problemRepo.getPatientProblemById.mockResolvedValue(undefined);
    const result = await validateUpdatePatientProblem('9', { title: 'Asthma' }, 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });
});
