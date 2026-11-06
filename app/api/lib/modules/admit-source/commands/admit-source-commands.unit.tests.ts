import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { admitSourceRepository } from '../repository/admit-source-repository';
import { validateCreateAdmitSource } from '../validator/create-admit-source-validator';
import { validateDeleteAdmitSource } from '../validator/delete-admit-source-validator';
import { validateUpdateAdmitSource } from '../validator/update-admit-source-validator';
import { createAdmitSourceCommand } from './create-admit-source-command';
import { deleteAdmitSourceCommand } from './delete-admit-source-command';
import { updateAdmitSourceCommand } from './update-admit-source-command';

vi.mock('../repository/admit-source-repository', () => ({
  admitSourceRepository: {
    createAdmitSource: vi.fn(),
    updateAdmitSource: vi.fn(),
    deleteAdmitSource: vi.fn(),
  },
}));
vi.mock('../validator/create-admit-source-validator', () => ({
  validateCreateAdmitSource: vi.fn(),
}));
vi.mock('../validator/update-admit-source-validator', () => ({
  validateUpdateAdmitSource: vi.fn(),
}));
vi.mock('../validator/delete-admit-source-validator', () => ({
  validateDeleteAdmitSource: vi.fn(),
}));

const repo = vi.mocked(admitSourceRepository);
const validateCreate = vi.mocked(validateCreateAdmitSource);
const validateUpdate = vi.mocked(validateUpdateAdmitSource);
const validateDelete = vi.mocked(validateDeleteAdmitSource);

const admitSource = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Doctor Referral',
  code: 'DOCREF',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

const payload = { name: 'Doctor Referral', code: 'DOCREF', description: undefined };

describe('AdmitSource commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: payload });
    validateUpdate.mockResolvedValue({ success: true, data: { id: 1, payload } });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createAdmitSource.mockResolvedValue(admitSource);
    repo.updateAdmitSource.mockResolvedValue(admitSource);
    repo.deleteAdmitSource.mockResolvedValue(admitSource);
  });

  describe('createAdmitSourceCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });

      const result = await createAdmitSourceCommand({}, 'tenant-1');

      expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
      expect(repo.createAdmitSource).not.toHaveBeenCalled();
    });

    it('should write the validated payload with the session tenant id', async () => {
      await createAdmitSourceCommand({ name: 'Doctor Referral', code: 'docref' }, 'tenant-1');

      expect(repo.createAdmitSource).toHaveBeenCalledWith({ ...payload, tenantId: 'tenant-1' });
    });

    it('should return the created admit source on success', async () => {
      await expect(createAdmitSourceCommand({}, 'tenant-1')).resolves.toEqual({
        success: true,
        data: admitSource,
      });
    });

    it('should map a known Postgres 23505 to a conflict error', async () => {
      repo.createAdmitSource.mockRejectedValue({
        cause: { code: '23505', constraint: 'admit_source_tenant_name_idx' },
      });

      await expect(createAdmitSourceCommand({}, 'tenant-1')).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Admit source name 'Doctor Referral' already exists."],
      });
    });

    it('should rethrow unknown repository errors', async () => {
      const error = new Error('database down');
      repo.createAdmitSource.mockRejectedValue(error);

      await expect(createAdmitSourceCommand({}, 'tenant-1')).rejects.toThrow(error);
    });
  });

  describe('updateAdmitSourceCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateUpdate.mockResolvedValue({ success: false, errors: ['Invalid'] });

      const result = await updateAdmitSourceCommand('1', 'tenant-1', {});

      expect(result).toMatchObject({ success: false, errors: ['Invalid'] });
      expect(repo.updateAdmitSource).not.toHaveBeenCalled();
    });

    it('should return not found when the row disappeared before the write', async () => {
      repo.updateAdmitSource.mockResolvedValue(undefined);

      await expect(updateAdmitSourceCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should map a known Postgres 23505 to a conflict error', async () => {
      repo.updateAdmitSource.mockRejectedValue({
        cause: { code: '23505', constraint: 'admit_source_tenant_code_idx' },
      });

      await expect(updateAdmitSourceCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Admit source code 'DOCREF' already exists."],
      });
    });

    it('should return the updated admit source on success', async () => {
      await expect(updateAdmitSourceCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: true,
        data: admitSource,
      });
    });
  });

  describe('deleteAdmitSourceCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateDelete.mockReturnValue({ success: false, errors: ['Admit source abc is Invalid.'] });

      const result = await deleteAdmitSourceCommand('abc', 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Admit source abc is Invalid.'] });
      expect(repo.deleteAdmitSource).not.toHaveBeenCalled();
    });

    it('should return not found when the row does not exist', async () => {
      repo.deleteAdmitSource.mockResolvedValue(undefined);

      await expect(deleteAdmitSourceCommand('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should return the deleted admit source on success', async () => {
      await expect(deleteAdmitSourceCommand('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: admitSource,
      });
      expect(repo.deleteAdmitSource).toHaveBeenCalledWith(1, 'tenant-1');
    });
  });
});
