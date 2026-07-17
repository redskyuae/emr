import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { wardRepository } from '../repository/ward-repository';
import { validateCreateWard } from '../validator/create-ward-validator';
import { validateDeleteWard } from '../validator/delete-ward-validator';
import { validateUpdateWard } from '../validator/update-ward-validator';
import { createWardCommand } from './create-ward-command';
import { deleteWardCommand } from './delete-ward-command';
import { updateWardCommand } from './update-ward-command';

vi.mock('../repository/ward-repository', () => ({
  wardRepository: {
    createWard: vi.fn(),
    updateWard: vi.fn(),
    deleteWard: vi.fn(),
  },
}));
vi.mock('../validator/create-ward-validator', () => ({
  validateCreateWard: vi.fn(),
}));
vi.mock('../validator/update-ward-validator', () => ({
  validateUpdateWard: vi.fn(),
}));
vi.mock('../validator/delete-ward-validator', () => ({
  validateDeleteWard: vi.fn(),
}));

const repo = vi.mocked(wardRepository);
const validateCreate = vi.mocked(validateCreateWard);
const validateUpdate = vi.mocked(validateUpdateWard);
const validateDelete = vi.mocked(validateDeleteWard);

const ward = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'General Ward',
  code: 'GEN',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

const payload = { name: 'General Ward', code: 'GEN', description: undefined };

describe('Ward commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: payload });
    validateUpdate.mockResolvedValue({ success: true, data: { id: 1, payload } });
    validateDelete.mockResolvedValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createWard.mockResolvedValue(ward);
    repo.updateWard.mockResolvedValue(ward);
    repo.deleteWard.mockResolvedValue(ward);
  });

  describe('createWardCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });

      const result = await createWardCommand({}, 'tenant-1');

      expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
      expect(repo.createWard).not.toHaveBeenCalled();
    });

    it('should write the validated payload with the session tenant id', async () => {
      await createWardCommand({ name: 'General Ward', code: 'gen' }, 'tenant-1');

      expect(repo.createWard).toHaveBeenCalledWith({ ...payload, tenantId: 'tenant-1' });
    });

    it('should return the created ward on success', async () => {
      await expect(createWardCommand({}, 'tenant-1')).resolves.toEqual({
        success: true,
        data: ward,
      });
    });

    it('should map a known Postgres 23505 to a conflict error', async () => {
      repo.createWard.mockRejectedValue({
        cause: { code: '23505', constraint: 'ward_tenant_name_idx' },
      });

      await expect(createWardCommand({}, 'tenant-1')).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Ward name 'General Ward' already exists."],
      });
    });

    it('should rethrow unknown repository errors', async () => {
      const error = new Error('database down');
      repo.createWard.mockRejectedValue(error);

      await expect(createWardCommand({}, 'tenant-1')).rejects.toThrow(error);
    });
  });

  describe('updateWardCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateUpdate.mockResolvedValue({ success: false, errors: ['Invalid'] });

      const result = await updateWardCommand('1', 'tenant-1', {});

      expect(result).toMatchObject({ success: false, errors: ['Invalid'] });
      expect(repo.updateWard).not.toHaveBeenCalled();
    });

    it('should return not found when the row disappeared before the write', async () => {
      repo.updateWard.mockResolvedValue(undefined);

      await expect(updateWardCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should map a known Postgres 23505 to a conflict error', async () => {
      repo.updateWard.mockRejectedValue({
        cause: { code: '23505', constraint: 'ward_tenant_code_idx' },
      });

      await expect(updateWardCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Ward code 'GEN' already exists."],
      });
    });

    it('should return the updated ward on success', async () => {
      await expect(updateWardCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: true,
        data: ward,
      });
    });
  });

  describe('deleteWardCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateDelete.mockResolvedValue({ success: false, errors: ['Ward abc is Invalid.'] });

      const result = await deleteWardCommand('abc', 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Ward abc is Invalid.'] });
      expect(repo.deleteWard).not.toHaveBeenCalled();
    });

    it('should return not found when the row does not exist', async () => {
      repo.deleteWard.mockResolvedValue(undefined);

      await expect(deleteWardCommand('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should return the deleted ward on success', async () => {
      await expect(deleteWardCommand('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: ward,
      });
      expect(repo.deleteWard).toHaveBeenCalledWith(1, 'tenant-1');
    });
  });
});
