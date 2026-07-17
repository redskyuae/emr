import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { visitTypeRepository } from '../repository/visit-type-repository';
import { validateCreateVisitType } from '../validator/create-visit-type-validator';
import { validateDeleteVisitType } from '../validator/delete-visit-type-validator';
import { validateUpdateVisitType } from '../validator/update-visit-type-validator';
import { createVisitTypeCommand } from './create-visit-type-command';
import { deleteVisitTypeCommand } from './delete-visit-type-command';
import { updateVisitTypeCommand } from './update-visit-type-command';

vi.mock('../repository/visit-type-repository', () => ({
  visitTypeRepository: {
    createVisitType: vi.fn(),
    updateVisitType: vi.fn(),
    deleteVisitType: vi.fn(),
  },
}));
vi.mock('../validator/create-visit-type-validator', () => ({
  validateCreateVisitType: vi.fn(),
}));
vi.mock('../validator/update-visit-type-validator', () => ({
  validateUpdateVisitType: vi.fn(),
}));
vi.mock('../validator/delete-visit-type-validator', () => ({
  validateDeleteVisitType: vi.fn(),
}));

const repo = vi.mocked(visitTypeRepository);
const validateCreate = vi.mocked(validateCreateVisitType);
const validateUpdate = vi.mocked(validateUpdateVisitType);
const validateDelete = vi.mocked(validateDeleteVisitType);

const visitType = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'OPD Consultation',
  code: 'OPD',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

const payload = { name: 'OPD Consultation', code: 'OPD', description: undefined };

describe('VisitType commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: payload });
    validateUpdate.mockResolvedValue({ success: true, data: { id: 1, payload } });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createVisitType.mockResolvedValue(visitType);
    repo.updateVisitType.mockResolvedValue(visitType);
    repo.deleteVisitType.mockResolvedValue(visitType);
  });

  describe('createVisitTypeCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });

      const result = await createVisitTypeCommand({}, 'tenant-1');

      expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
      expect(repo.createVisitType).not.toHaveBeenCalled();
    });

    it('should write the validated payload with the session tenant id', async () => {
      await createVisitTypeCommand({ name: 'OPD Consultation', code: 'opd' }, 'tenant-1');

      expect(repo.createVisitType).toHaveBeenCalledWith({ ...payload, tenantId: 'tenant-1' });
    });

    it('should return the created visit type on success', async () => {
      await expect(createVisitTypeCommand({}, 'tenant-1')).resolves.toEqual({
        success: true,
        data: visitType,
      });
    });

    it('should map a known Postgres 23505 to a conflict error', async () => {
      repo.createVisitType.mockRejectedValue({
        cause: { code: '23505', constraint: 'visit_type_tenant_name_idx' },
      });

      await expect(createVisitTypeCommand({}, 'tenant-1')).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Visit type name 'OPD Consultation' already exists."],
      });
    });

    it('should rethrow unknown repository errors', async () => {
      const error = new Error('database down');
      repo.createVisitType.mockRejectedValue(error);

      await expect(createVisitTypeCommand({}, 'tenant-1')).rejects.toThrow(error);
    });
  });

  describe('updateVisitTypeCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateUpdate.mockResolvedValue({ success: false, errors: ['Invalid'] });

      const result = await updateVisitTypeCommand('1', 'tenant-1', {});

      expect(result).toMatchObject({ success: false, errors: ['Invalid'] });
      expect(repo.updateVisitType).not.toHaveBeenCalled();
    });

    it('should return not found when the row disappeared before the write', async () => {
      repo.updateVisitType.mockResolvedValue(undefined);

      await expect(updateVisitTypeCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should map a known Postgres 23505 to a conflict error', async () => {
      repo.updateVisitType.mockRejectedValue({
        cause: { code: '23505', constraint: 'visit_type_tenant_code_idx' },
      });

      await expect(updateVisitTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Visit type code 'OPD' already exists."],
      });
    });

    it('should return the updated visit type on success', async () => {
      await expect(updateVisitTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: true,
        data: visitType,
      });
    });
  });

  describe('deleteVisitTypeCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateDelete.mockReturnValue({ success: false, errors: ['Visit type abc is Invalid.'] });

      const result = await deleteVisitTypeCommand('abc', 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Visit type abc is Invalid.'] });
      expect(repo.deleteVisitType).not.toHaveBeenCalled();
    });

    it('should return not found when the row does not exist', async () => {
      repo.deleteVisitType.mockResolvedValue(undefined);

      await expect(deleteVisitTypeCommand('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should return the deleted visit type on success', async () => {
      await expect(deleteVisitTypeCommand('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: visitType,
      });
      expect(repo.deleteVisitType).toHaveBeenCalledWith(1, 'tenant-1');
    });
  });
});
