import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientProblemRepository } from '../repository/patient-problem-repository';
import { validateCreatePatientProblem } from '../validator/create-patient-problem-validator';
import { validateUpdatePatientProblem } from '../validator/update-patient-problem-validator';
import { validateDeletePatientProblem } from '../validator/delete-patient-problem-validator';
import { createPatientProblemCommand } from './create-patient-problem-command';
import { updatePatientProblemCommand } from './update-patient-problem-command';
import { deletePatientProblemCommand } from './delete-patient-problem-command';

vi.mock('../repository/patient-problem-repository', () => ({
  patientProblemRepository: {
    createPatientProblem: vi.fn(),
    updatePatientProblem: vi.fn(),
    deletePatientProblem: vi.fn(),
  },
}));
vi.mock('../validator/create-patient-problem-validator', () => ({
  validateCreatePatientProblem: vi.fn(),
}));
vi.mock('../validator/update-patient-problem-validator', () => ({
  validateUpdatePatientProblem: vi.fn(),
}));
vi.mock('../validator/delete-patient-problem-validator', () => ({
  validateDeletePatientProblem: vi.fn(),
}));

const repo = patientProblemRepository as typeof patientProblemRepository & {
  createPatientProblem: Mock<typeof patientProblemRepository.createPatientProblem>;
  updatePatientProblem: Mock<typeof patientProblemRepository.updatePatientProblem>;
  deletePatientProblem: Mock<typeof patientProblemRepository.deletePatientProblem>;
};
const validateCreate = validateCreatePatientProblem as Mock<typeof validateCreatePatientProblem>;
const validateUpdate = validateUpdatePatientProblem as Mock<typeof validateUpdatePatientProblem>;
const validateDelete = validateDeletePatientProblem as Mock<typeof validateDeletePatientProblem>;
const problem = { id: 9, patientId: 1 } as never;

describe('PatientProblem commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { patientId: 1, payload: { title: 'Hypertension', clinicalStatus: 'active' } },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 9, payload: { title: 'Hypertension', clinicalStatus: 'active' } },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 9, tenantId: 'tenant-1' } });
    repo.createPatientProblem.mockResolvedValue(problem);
    repo.updatePatientProblem.mockResolvedValue(problem);
    repo.deletePatientProblem.mockResolvedValue(problem);
  });

  it('should not write when validation fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['bad'] });
    await createPatientProblemCommand('1', 'tenant-1', 'user-1', {});
    expect(repo.createPatientProblem).not.toHaveBeenCalled();
  });

  it('should create with provenance', async () => {
    await createPatientProblemCommand('1', 'tenant-1', 'user-1', {});
    expect(repo.createPatientProblem).toHaveBeenCalledWith({
      title: 'Hypertension',
      clinicalStatus: 'active',
      tenantId: 'tenant-1',
      patientId: 1,
      recordedByUserId: 'user-1',
    });
  });

  it('should return success payloads', async () => {
    await expect(createPatientProblemCommand('1', 'tenant-1', 'user-1', {})).resolves.toEqual({
      success: true,
      data: problem,
    });
    await expect(updatePatientProblemCommand('9', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: problem,
    });
    await expect(deletePatientProblemCommand('9', 'tenant-1')).resolves.toEqual({
      success: true,
      data: problem,
    });
  });

  it('should return not-found when update target is missing', async () => {
    repo.updatePatientProblem.mockResolvedValue(undefined);
    await expect(updatePatientProblemCommand('9', 'tenant-1', {})).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });
});
