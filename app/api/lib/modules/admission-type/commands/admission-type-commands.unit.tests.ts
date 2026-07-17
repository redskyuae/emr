import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { admissionTypeRepository } from '../repository/admission-type-repository';
import { validateCreateAdmissionType } from '../validator/create-admission-type-validator';
import { validateDeleteAdmissionType } from '../validator/delete-admission-type-validator';
import { validateUpdateAdmissionType } from '../validator/update-admission-type-validator';
import { createAdmissionTypeCommand } from './create-admission-type-command';
import { deleteAdmissionTypeCommand } from './delete-admission-type-command';
import { updateAdmissionTypeCommand } from './update-admission-type-command';

vi.mock('../repository/admission-type-repository', () => ({
  admissionTypeRepository: {
    createAdmissionType: vi.fn(),
    updateAdmissionType: vi.fn(),
    deleteAdmissionType: vi.fn(),
  },
}));
vi.mock('../validator/create-admission-type-validator', () => ({
  validateCreateAdmissionType: vi.fn(),
}));
vi.mock('../validator/update-admission-type-validator', () => ({
  validateUpdateAdmissionType: vi.fn(),
}));
vi.mock('../validator/delete-admission-type-validator', () => ({
  validateDeleteAdmissionType: vi.fn(),
}));

const repo = vi.mocked(admissionTypeRepository);
const validateCreate = vi.mocked(validateCreateAdmissionType);
const validateUpdate = vi.mocked(validateUpdateAdmissionType);
const validateDelete = vi.mocked(validateDeleteAdmissionType);

const admissionType = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Emergency',
  code: 'EMER',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

const payload = { name: 'Emergency', code: 'EMER', description: undefined };

describe('AdmissionType commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: payload });
    validateUpdate.mockResolvedValue({ success: true, data: { id: 1, payload } });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createAdmissionType.mockResolvedValue(admissionType);
    repo.updateAdmissionType.mockResolvedValue(admissionType);
    repo.deleteAdmissionType.mockResolvedValue(admissionType);
  });

  describe('createAdmissionTypeCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });

      const result = await createAdmissionTypeCommand({}, 'tenant-1');

      expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
      expect(repo.createAdmissionType).not.toHaveBeenCalled();
    });

    it('should write the validated payload with the session tenant id', async () => {
      await createAdmissionTypeCommand({ name: 'Emergency', code: 'emer' }, 'tenant-1');

      expect(repo.createAdmissionType).toHaveBeenCalledWith({ ...payload, tenantId: 'tenant-1' });
    });

    it('should return the created admission type on success', async () => {
      await expect(createAdmissionTypeCommand({}, 'tenant-1')).resolves.toEqual({
        success: true,
        data: admissionType,
      });
    });

    it('should map a known Postgres 23505 to a conflict error', async () => {
      repo.createAdmissionType.mockRejectedValue({
        cause: { code: '23505', constraint: 'admission_type_tenant_name_idx' },
      });

      await expect(createAdmissionTypeCommand({}, 'tenant-1')).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Admission type name 'Emergency' already exists."],
      });
    });

    it('should rethrow unknown repository errors', async () => {
      const error = new Error('database down');
      repo.createAdmissionType.mockRejectedValue(error);

      await expect(createAdmissionTypeCommand({}, 'tenant-1')).rejects.toThrow(error);
    });
  });

  describe('updateAdmissionTypeCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateUpdate.mockResolvedValue({ success: false, errors: ['Invalid'] });

      const result = await updateAdmissionTypeCommand('1', 'tenant-1', {});

      expect(result).toMatchObject({ success: false, errors: ['Invalid'] });
      expect(repo.updateAdmissionType).not.toHaveBeenCalled();
    });

    it('should return not found when the row disappeared before the write', async () => {
      repo.updateAdmissionType.mockResolvedValue(undefined);

      await expect(updateAdmissionTypeCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should map a known Postgres 23505 to a conflict error', async () => {
      repo.updateAdmissionType.mockRejectedValue({
        cause: { code: '23505', constraint: 'admission_type_tenant_code_idx' },
      });

      await expect(updateAdmissionTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Admission type code 'EMER' already exists."],
      });
    });

    it('should return the updated admission type on success', async () => {
      await expect(updateAdmissionTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: true,
        data: admissionType,
      });
    });
  });

  describe('deleteAdmissionTypeCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateDelete.mockReturnValue({
        success: false,
        errors: ['Admission type abc is Invalid.'],
      });

      const result = await deleteAdmissionTypeCommand('abc', 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Admission type abc is Invalid.'] });
      expect(repo.deleteAdmissionType).not.toHaveBeenCalled();
    });

    it('should return not found when the row does not exist', async () => {
      repo.deleteAdmissionType.mockResolvedValue(undefined);

      await expect(deleteAdmissionTypeCommand('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should return the deleted admission type on success', async () => {
      await expect(deleteAdmissionTypeCommand('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: admissionType,
      });
      expect(repo.deleteAdmissionType).toHaveBeenCalledWith(1, 'tenant-1');
    });
  });
});
