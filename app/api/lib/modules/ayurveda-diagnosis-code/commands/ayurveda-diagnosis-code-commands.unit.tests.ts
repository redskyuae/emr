import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import { validateAyurvedaDiagnosisCodeId } from '../validator/ayurveda-diagnosis-code-id-validator';
import { validateCreateAyurvedaDiagnosisCode } from '../validator/create-ayurveda-diagnosis-code-validator';
import { validateUpdateAyurvedaDiagnosisCode } from '../validator/update-ayurveda-diagnosis-code-validator';
import { createAyurvedaDiagnosisCodeCommand } from './create-ayurveda-diagnosis-code-command';
import { deleteAyurvedaDiagnosisCodeCommand } from './delete-ayurveda-diagnosis-code-command';
import { updateAyurvedaDiagnosisCodeCommand } from './update-ayurveda-diagnosis-code-command';

vi.mock('../repository/ayurveda-diagnosis-code-repository', () => ({
  ayurvedaDiagnosisCodeRepository: {
    createAyurvedaDiagnosisCode: vi.fn(),
    updateAyurvedaDiagnosisCode: vi.fn(),
    deleteAyurvedaDiagnosisCode: vi.fn(),
  },
}));
vi.mock('../validator/create-ayurveda-diagnosis-code-validator', () => ({
  validateCreateAyurvedaDiagnosisCode: vi.fn(),
}));
vi.mock('../validator/update-ayurveda-diagnosis-code-validator', () => ({
  validateUpdateAyurvedaDiagnosisCode: vi.fn(),
}));
vi.mock('../validator/ayurveda-diagnosis-code-id-validator', () => ({
  validateAyurvedaDiagnosisCodeId: vi.fn(),
}));

const repo = vi.mocked(ayurvedaDiagnosisCodeRepository);
const validateCreate = vi.mocked(validateCreateAyurvedaDiagnosisCode);
const validateUpdate = vi.mocked(validateUpdateAyurvedaDiagnosisCode);
const validateId = vi.mocked(validateAyurvedaDiagnosisCodeId);

const payload = {
  code: 'AYU-AMV',
  name: 'Amavata',
  category: undefined,
  englishName: 'Rheumatoid arthritis',
  icdDiagnosisCodeId: 5,
};
const ayurvedaDiagnosisCode = {
  id: 1,
  code: 'AYU-AMV',
  name: 'Amavata',
  tenantId: 'tenant-1',
  category: null,
  englishName: 'Rheumatoid arthritis',
  createdOn: new Date(),
  modifiedOn: new Date(),
  icdDiagnosisCode: { id: 5, code: 'M06.9', title: 'Rheumatoid arthritis, unspecified' },
};
const uniqueViolation = {
  cause: { code: '23505', constraint: 'ayurveda_diagnosis_code_tenant_code_idx' },
};

describe('AyurvedaDiagnosisCode commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: payload });
    validateUpdate.mockResolvedValue({ success: true, data: { id: 1, payload } });
    validateId.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createAyurvedaDiagnosisCode.mockResolvedValue(ayurvedaDiagnosisCode);
    repo.updateAyurvedaDiagnosisCode.mockResolvedValue(ayurvedaDiagnosisCode);
    repo.deleteAyurvedaDiagnosisCode.mockResolvedValue({ id: 1 });
  });

  describe('createAyurvedaDiagnosisCodeCommand', () => {
    it('should return the validation failure and not write', async () => {
      validateCreate.mockResolvedValue({
        success: false,
        errors: ['Diagnosis code 5 is Invalid.'],
        status: StatusCodes.CONFLICT,
      });

      await expect(createAyurvedaDiagnosisCodeCommand({}, 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Diagnosis code 5 is Invalid.'],
        status: StatusCodes.CONFLICT,
      });
      expect(repo.createAyurvedaDiagnosisCode).not.toHaveBeenCalled();
    });

    it('should create with the session Tenant and return the read model', async () => {
      await expect(createAyurvedaDiagnosisCodeCommand(payload, 'tenant-1')).resolves.toEqual({
        success: true,
        data: ayurvedaDiagnosisCode,
      });
      expect(validateCreate).toHaveBeenCalledWith(payload, 'tenant-1');
      expect(repo.createAyurvedaDiagnosisCode).toHaveBeenCalledWith({
        ...payload,
        tenantId: 'tenant-1',
      });
    });

    it('should map a Postgres 23505 on the code index to a conflict', async () => {
      repo.createAyurvedaDiagnosisCode.mockRejectedValue(uniqueViolation);

      await expect(createAyurvedaDiagnosisCodeCommand(payload, 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Ayurveda diagnosis code AYU-AMV already exists.'],
        status: StatusCodes.CONFLICT,
      });
    });

    it('should rethrow unknown repository errors', async () => {
      const error = new Error('database down');
      repo.createAyurvedaDiagnosisCode.mockRejectedValue(error);

      await expect(createAyurvedaDiagnosisCodeCommand(payload, 'tenant-1')).rejects.toThrow(error);
    });
  });

  describe('updateAyurvedaDiagnosisCodeCommand', () => {
    it('should return the validation failure with its status and not write', async () => {
      validateUpdate.mockResolvedValue({
        success: false,
        errors: ['Ayurveda diagnosis code not found'],
        status: StatusCodes.NOT_FOUND,
      });

      await expect(updateAyurvedaDiagnosisCodeCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: false,
        errors: ['Ayurveda diagnosis code not found'],
        status: StatusCodes.NOT_FOUND,
      });
      expect(repo.updateAyurvedaDiagnosisCode).not.toHaveBeenCalled();
    });

    it('should update by id with the session Tenant', async () => {
      await expect(updateAyurvedaDiagnosisCodeCommand('1', 'tenant-1', payload)).resolves.toEqual({
        success: true,
        data: ayurvedaDiagnosisCode,
      });
      expect(repo.updateAyurvedaDiagnosisCode).toHaveBeenCalledWith(1, {
        ...payload,
        tenantId: 'tenant-1',
      });
    });

    it('should return not found when the row vanished before the write', async () => {
      repo.updateAyurvedaDiagnosisCode.mockResolvedValue(undefined);

      await expect(updateAyurvedaDiagnosisCodeCommand('1', 'tenant-1', payload)).resolves.toEqual({
        success: false,
        errors: ['Ayurveda diagnosis code not found'],
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should map a Postgres 23505 on the code index to a conflict', async () => {
      repo.updateAyurvedaDiagnosisCode.mockRejectedValue(uniqueViolation);

      await expect(
        updateAyurvedaDiagnosisCodeCommand('1', 'tenant-1', payload)
      ).resolves.toMatchObject({ success: false, status: StatusCodes.CONFLICT });
    });

    it('should rethrow unknown repository errors', async () => {
      const error = new Error('database down');
      repo.updateAyurvedaDiagnosisCode.mockRejectedValue(error);

      await expect(updateAyurvedaDiagnosisCodeCommand('1', 'tenant-1', payload)).rejects.toThrow(
        error
      );
    });
  });

  describe('deleteAyurvedaDiagnosisCodeCommand', () => {
    it('should return the validation failure and not delete', async () => {
      validateId.mockReturnValue({
        success: false,
        errors: ['Ayurveda diagnosis code x is Invalid.'],
      });

      await expect(deleteAyurvedaDiagnosisCodeCommand('x', 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Ayurveda diagnosis code x is Invalid.'],
      });
      expect(repo.deleteAyurvedaDiagnosisCode).not.toHaveBeenCalled();
    });

    it('should soft delete by id and Tenant', async () => {
      await expect(deleteAyurvedaDiagnosisCodeCommand('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: { id: 1 },
      });
      expect(repo.deleteAyurvedaDiagnosisCode).toHaveBeenCalledWith(1, 'tenant-1');
    });

    it('should return not found when nothing was deleted', async () => {
      repo.deleteAyurvedaDiagnosisCode.mockResolvedValue(undefined);

      await expect(deleteAyurvedaDiagnosisCodeCommand('1', 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Ayurveda diagnosis code not found'],
        status: StatusCodes.NOT_FOUND,
      });
    });
  });
});
