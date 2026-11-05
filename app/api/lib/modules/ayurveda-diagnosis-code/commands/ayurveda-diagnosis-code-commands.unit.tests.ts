import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import { validateCreateAyurvedaDiagnosisCode } from '../validator/create-ayurveda-diagnosis-code-validator';
import { validateDeleteAyurvedaDiagnosisCode } from '../validator/delete-ayurveda-diagnosis-code-validator';
import { validateAyurvedaDiagnosisCodeExists } from '../validator/ayurveda-diagnosis-code-exists-validator';
import { validateUpdateAyurvedaDiagnosisCode } from '../validator/update-ayurveda-diagnosis-code-validator';
import { activateAyurvedaDiagnosisCodeCommand } from './activate-ayurveda-diagnosis-code-command';
import { createAyurvedaDiagnosisCodeCommand } from './create-ayurveda-diagnosis-code-command';
import { deactivateAyurvedaDiagnosisCodeCommand } from './deactivate-ayurveda-diagnosis-code-command';
import { deleteAyurvedaDiagnosisCodeCommand } from './delete-ayurveda-diagnosis-code-command';
import { updateAyurvedaDiagnosisCodeCommand } from './update-ayurveda-diagnosis-code-command';

vi.mock('../repository/ayurveda-diagnosis-code-repository', () => ({
  ayurvedaDiagnosisCodeRepository: {
    createAyurvedaDiagnosisCode: vi.fn(),
    updateAyurvedaDiagnosisCode: vi.fn(),
    deleteAyurvedaDiagnosisCode: vi.fn(),
    setAyurvedaDiagnosisCodeActive: vi.fn(),
  },
}));
vi.mock('../validator/create-ayurveda-diagnosis-code-validator', () => ({
  validateCreateAyurvedaDiagnosisCode: vi.fn(),
}));
vi.mock('../validator/update-ayurveda-diagnosis-code-validator', () => ({
  validateUpdateAyurvedaDiagnosisCode: vi.fn(),
}));
vi.mock('../validator/delete-ayurveda-diagnosis-code-validator', () => ({
  validateDeleteAyurvedaDiagnosisCode: vi.fn(),
}));
vi.mock('../validator/ayurveda-diagnosis-code-exists-validator', () => ({
  validateAyurvedaDiagnosisCodeExists: vi.fn(),
}));

const repo = ayurvedaDiagnosisCodeRepository as typeof ayurvedaDiagnosisCodeRepository & {
  createAyurvedaDiagnosisCode: Mock<
    typeof ayurvedaDiagnosisCodeRepository.createAyurvedaDiagnosisCode
  >;
  updateAyurvedaDiagnosisCode: Mock<
    typeof ayurvedaDiagnosisCodeRepository.updateAyurvedaDiagnosisCode
  >;
  deleteAyurvedaDiagnosisCode: Mock<
    typeof ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode
  >;
  setAyurvedaDiagnosisCodeActive: Mock<
    typeof ayurvedaDiagnosisCodeRepository.setAyurvedaDiagnosisCodeActive
  >;
};
const validateCreate = validateCreateAyurvedaDiagnosisCode as Mock<
  typeof validateCreateAyurvedaDiagnosisCode
>;
const validateUpdate = validateUpdateAyurvedaDiagnosisCode as Mock<
  typeof validateUpdateAyurvedaDiagnosisCode
>;
const validateDelete = validateDeleteAyurvedaDiagnosisCode as Mock<
  typeof validateDeleteAyurvedaDiagnosisCode
>;
const validateExists = validateAyurvedaDiagnosisCodeExists as Mock<
  typeof validateAyurvedaDiagnosisCodeExists
>;
const ayurvedaDiagnosisCode = {
  id: 1,
  tenantId: 'tenant-1',
  code: 'AYU-JVARA',
  title: 'Jvara (Fever)',
  category: null,
  isActive: true,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AyurvedaDiagnosisCode commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { code: 'AYU-JVARA', title: 'Jvara (Fever)', category: undefined },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        payload: { code: 'AYU-JVARA', title: 'Jvara (Fever)', category: undefined },
      },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createAyurvedaDiagnosisCode.mockResolvedValue(ayurvedaDiagnosisCode);
    repo.updateAyurvedaDiagnosisCode.mockResolvedValue(ayurvedaDiagnosisCode);
    repo.deleteAyurvedaDiagnosisCode.mockResolvedValue(ayurvedaDiagnosisCode);
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createAyurvedaDiagnosisCodeCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createAyurvedaDiagnosisCode).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on success', async () => {
    await createAyurvedaDiagnosisCodeCommand({}, 'tenant-1');
    expect(repo.createAyurvedaDiagnosisCode).toHaveBeenCalledWith({
      code: 'AYU-JVARA',
      title: 'Jvara (Fever)',
      category: undefined,
      tenantId: 'tenant-1',
    });
  });

  it('should return created/updated/deleted data on repository success', async () => {
    await expect(createAyurvedaDiagnosisCodeCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: ayurvedaDiagnosisCode,
    });
    await expect(updateAyurvedaDiagnosisCodeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: ayurvedaDiagnosisCode,
    });
    await expect(deleteAyurvedaDiagnosisCodeCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: ayurvedaDiagnosisCode,
    });
  });

  it('should map known Postgres unique constraint 23505 for code index to conflict error', async () => {
    repo.createAyurvedaDiagnosisCode.mockRejectedValue({
      cause: { code: '23505', constraint: 'ayurveda_diagnosis_code_tenant_code_idx' },
    });
    await expect(createAyurvedaDiagnosisCodeCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Ayurveda diagnosis code 'AYU-JVARA' already exists."],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createAyurvedaDiagnosisCode.mockRejectedValue(error);
    await expect(createAyurvedaDiagnosisCodeCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should activate and deactivate through the repository after validation', async () => {
    validateExists.mockResolvedValue({ success: true, data: ayurvedaDiagnosisCode });
    repo.setAyurvedaDiagnosisCodeActive.mockResolvedValue(ayurvedaDiagnosisCode);

    await expect(activateAyurvedaDiagnosisCodeCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: ayurvedaDiagnosisCode,
    });
    expect(repo.setAyurvedaDiagnosisCodeActive).toHaveBeenLastCalledWith(1, 'tenant-1', true);

    await expect(deactivateAyurvedaDiagnosisCodeCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: ayurvedaDiagnosisCode,
    });
    expect(repo.setAyurvedaDiagnosisCodeActive).toHaveBeenLastCalledWith(1, 'tenant-1', false);
  });

  it('should not write when activation validation fails', async () => {
    const failure = {
      success: false as const,
      errors: ['Ayurveda diagnosis code not found'],
      status: StatusCodes.NOT_FOUND,
    };
    validateExists.mockResolvedValue(failure);

    await expect(activateAyurvedaDiagnosisCodeCommand('1', 'tenant-1')).resolves.toEqual(failure);
    await expect(deactivateAyurvedaDiagnosisCodeCommand('1', 'tenant-1')).resolves.toEqual(failure);
    expect(repo.setAyurvedaDiagnosisCodeActive).not.toHaveBeenCalled();
  });

  it('should return not-found when the code disappears before activation is written', async () => {
    validateExists.mockResolvedValue({ success: true, data: ayurvedaDiagnosisCode });
    repo.setAyurvedaDiagnosisCodeActive.mockResolvedValue(undefined);

    await expect(deactivateAyurvedaDiagnosisCodeCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Ayurveda diagnosis code not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should preserve validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateAyurvedaDiagnosisCodeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
  });
});
