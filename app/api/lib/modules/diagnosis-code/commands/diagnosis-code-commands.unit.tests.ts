import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { diagnosisCodeRepository } from '../repository/diagnosis-code-repository';
import { validateCreateDiagnosisCode } from '../validator/create-diagnosis-code-validator';
import { validateDeleteDiagnosisCode } from '../validator/delete-diagnosis-code-validator';
import { validateUpdateDiagnosisCode } from '../validator/update-diagnosis-code-validator';
import { createDiagnosisCodeCommand } from './create-diagnosis-code-command';
import { deleteDiagnosisCodeCommand } from './delete-diagnosis-code-command';
import { updateDiagnosisCodeCommand } from './update-diagnosis-code-command';

vi.mock('../repository/diagnosis-code-repository', () => ({
  diagnosisCodeRepository: {
    createDiagnosisCode: vi.fn(),
    updateDiagnosisCode: vi.fn(),
    deleteDiagnosisCode: vi.fn(),
  },
}));
vi.mock('../validator/create-diagnosis-code-validator', () => ({
  validateCreateDiagnosisCode: vi.fn(),
}));
vi.mock('../validator/update-diagnosis-code-validator', () => ({
  validateUpdateDiagnosisCode: vi.fn(),
}));
vi.mock('../validator/delete-diagnosis-code-validator', () => ({
  validateDeleteDiagnosisCode: vi.fn(),
}));

const repo = diagnosisCodeRepository as typeof diagnosisCodeRepository & {
  createDiagnosisCode: Mock<typeof diagnosisCodeRepository.createDiagnosisCode>;
  updateDiagnosisCode: Mock<typeof diagnosisCodeRepository.updateDiagnosisCode>;
  deleteDiagnosisCode: Mock<typeof diagnosisCodeRepository.deleteDiagnosisCode>;
};
const validateCreate = validateCreateDiagnosisCode as Mock<typeof validateCreateDiagnosisCode>;
const validateUpdate = validateUpdateDiagnosisCode as Mock<typeof validateUpdateDiagnosisCode>;
const validateDelete = validateDeleteDiagnosisCode as Mock<typeof validateDeleteDiagnosisCode>;
const diagnosisCode = {
  id: 1,
  tenantId: 'tenant-1',
  code: 'I10',
  title: 'Essential hypertension',
  category: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('DiagnosisCode commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { code: 'I10', title: 'Essential hypertension', category: undefined },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        payload: { code: 'I10', title: 'Essential hypertension', category: undefined },
      },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createDiagnosisCode.mockResolvedValue(diagnosisCode);
    repo.updateDiagnosisCode.mockResolvedValue(diagnosisCode);
    repo.deleteDiagnosisCode.mockResolvedValue(diagnosisCode);
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createDiagnosisCodeCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createDiagnosisCode).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on success', async () => {
    await createDiagnosisCodeCommand({}, 'tenant-1');
    expect(repo.createDiagnosisCode).toHaveBeenCalledWith({
      code: 'I10',
      title: 'Essential hypertension',
      category: undefined,
      tenantId: 'tenant-1',
    });
  });

  it('should return created/updated/deleted data on repository success', async () => {
    await expect(createDiagnosisCodeCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: diagnosisCode,
    });
    await expect(updateDiagnosisCodeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: diagnosisCode,
    });
    await expect(deleteDiagnosisCodeCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: diagnosisCode,
    });
  });

  it('should map known Postgres unique constraint 23505 for code index to conflict error', async () => {
    repo.createDiagnosisCode.mockRejectedValue({
      cause: { code: '23505', constraint: 'diagnosis_code_tenant_code_idx' },
    });
    await expect(createDiagnosisCodeCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Diagnosis code 'I10' already exists."],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createDiagnosisCode.mockRejectedValue(error);
    await expect(createDiagnosisCodeCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should preserve validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateDiagnosisCodeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
  });
});
