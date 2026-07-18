import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { chargeItemRepository } from '../repository/charge-item-repository';
import { validateCreateChargeItem } from '../validator/create-charge-item-validator';
import { validateDeleteChargeItem } from '../validator/delete-charge-item-validator';
import { validateUpdateChargeItem } from '../validator/update-charge-item-validator';
import { createChargeItemCommand } from './create-charge-item-command';
import { deleteChargeItemCommand } from './delete-charge-item-command';
import { updateChargeItemCommand } from './update-charge-item-command';

vi.mock('../repository/charge-item-repository', () => ({
  chargeItemRepository: {
    createChargeItem: vi.fn(),
    updateChargeItem: vi.fn(),
    deleteChargeItem: vi.fn(),
  },
}));
vi.mock('../validator/create-charge-item-validator', () => ({
  validateCreateChargeItem: vi.fn(),
}));
vi.mock('../validator/update-charge-item-validator', () => ({
  validateUpdateChargeItem: vi.fn(),
}));
vi.mock('../validator/delete-charge-item-validator', () => ({
  validateDeleteChargeItem: vi.fn(),
}));

const repo = vi.mocked(chargeItemRepository);
const validateCreate = vi.mocked(validateCreateChargeItem);
const validateUpdate = vi.mocked(validateUpdateChargeItem);
const validateDelete = vi.mocked(validateDeleteChargeItem);

const chargeItem = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'General Consultation',
  code: 'CONS',
  category: 'CONSULTATION' as const,
  unitPrice: 500,
  isActive: true,
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

const payload = {
  name: 'General Consultation',
  code: 'CONS',
  category: 'CONSULTATION' as const,
  unitPrice: 500,
  description: undefined,
  isActive: true,
};

describe('ChargeItem commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: payload });
    validateUpdate.mockResolvedValue({ success: true, data: { id: 1, payload } });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createChargeItem.mockResolvedValue(chargeItem);
    repo.updateChargeItem.mockResolvedValue(chargeItem);
    repo.deleteChargeItem.mockResolvedValue(chargeItem);
  });

  describe('createChargeItemCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });

      const result = await createChargeItemCommand({}, 'tenant-1');

      expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
      expect(repo.createChargeItem).not.toHaveBeenCalled();
    });

    it('should write the validated payload with the session tenant id', async () => {
      await createChargeItemCommand(payload, 'tenant-1');

      expect(repo.createChargeItem).toHaveBeenCalledWith({ ...payload, tenantId: 'tenant-1' });
    });

    it('should return the created charge item on success', async () => {
      await expect(createChargeItemCommand({}, 'tenant-1')).resolves.toEqual({
        success: true,
        data: chargeItem,
      });
    });

    it('should map a known Postgres 23505 to a conflict error', async () => {
      repo.createChargeItem.mockRejectedValue({
        cause: { code: '23505', constraint: 'charge_item_tenant_name_idx' },
      });

      await expect(createChargeItemCommand({}, 'tenant-1')).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Charge item name General Consultation already exists.'],
      });
    });

    it('should rethrow unknown repository errors', async () => {
      const error = new Error('database down');
      repo.createChargeItem.mockRejectedValue(error);

      await expect(createChargeItemCommand({}, 'tenant-1')).rejects.toThrow(error);
    });
  });

  describe('updateChargeItemCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateUpdate.mockResolvedValue({ success: false, errors: ['Invalid'] });

      const result = await updateChargeItemCommand('1', 'tenant-1', {});

      expect(result).toMatchObject({ success: false, errors: ['Invalid'] });
      expect(repo.updateChargeItem).not.toHaveBeenCalled();
    });

    it('should return not found when the row disappeared before the write', async () => {
      repo.updateChargeItem.mockResolvedValue(undefined);

      await expect(updateChargeItemCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should map a known Postgres 23505 to a conflict error', async () => {
      repo.updateChargeItem.mockRejectedValue({
        cause: { code: '23505', constraint: 'charge_item_tenant_code_idx' },
      });

      await expect(updateChargeItemCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Charge item code CONS already exists.'],
      });
    });

    it('should return the updated charge item on success', async () => {
      await expect(updateChargeItemCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: true,
        data: chargeItem,
      });
    });
  });

  describe('deleteChargeItemCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateDelete.mockReturnValue({ success: false, errors: ['Charge item abc is Invalid.'] });

      const result = await deleteChargeItemCommand('abc', 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Charge item abc is Invalid.'] });
      expect(repo.deleteChargeItem).not.toHaveBeenCalled();
    });

    it('should return not found when the row does not exist', async () => {
      repo.deleteChargeItem.mockResolvedValue(undefined);

      await expect(deleteChargeItemCommand('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should return the deleted charge item on success', async () => {
      await expect(deleteChargeItemCommand('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: chargeItem,
      });
      expect(repo.deleteChargeItem).toHaveBeenCalledWith(1, 'tenant-1');
    });
  });
});
