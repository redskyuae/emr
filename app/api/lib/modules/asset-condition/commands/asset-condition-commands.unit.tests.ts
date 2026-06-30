import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assetConditionRepository } from '../repository/asset-condition-repository';
import { validateCreateAssetCondition } from '../validator/create-asset-condition-validator';
import { validateDeleteAssetCondition } from '../validator/delete-asset-condition-validator';
import { validateUpdateAssetCondition } from '../validator/update-asset-condition-validator';
import { createAssetConditionCommand } from './create-asset-condition-command';
import { deleteAssetConditionCommand } from './delete-asset-condition-command';
import { updateAssetConditionCommand } from './update-asset-condition-command';

vi.mock('../repository/asset-condition-repository', () => ({
  assetConditionRepository: {
    createAssetCondition: vi.fn(),
    updateAssetCondition: vi.fn(),
    deleteAssetCondition: vi.fn(),
  },
}));
vi.mock('../validator/create-asset-condition-validator', () => ({
  validateCreateAssetCondition: vi.fn(),
}));
vi.mock('../validator/update-asset-condition-validator', () => ({
  validateUpdateAssetCondition: vi.fn(),
}));
vi.mock('../validator/delete-asset-condition-validator', () => ({
  validateDeleteAssetCondition: vi.fn(),
}));

const repo = vi.mocked(assetConditionRepository);
const validateCreate = vi.mocked(validateCreateAssetCondition);
const validateUpdate = vi.mocked(validateUpdateAssetCondition);
const validateDelete = vi.mocked(validateDeleteAssetCondition);
const condition = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Good',
  code: 'GD',
  color: '#16A34A',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AssetCondition commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { name: 'Good', code: 'GD', color: '#16A34A', description: undefined },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        payload: { name: 'Good', code: 'GD', color: '#16A34A', description: undefined },
      },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createAssetCondition.mockResolvedValue(condition);
    repo.updateAssetCondition.mockResolvedValue(condition);
    repo.deleteAssetCondition.mockResolvedValue(condition);
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createAssetConditionCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createAssetCondition).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on success', async () => {
    await createAssetConditionCommand({}, 'tenant-1');
    expect(repo.createAssetCondition).toHaveBeenCalledWith({
      name: 'Good',
      code: 'GD',
      color: '#16A34A',
      description: undefined,
      tenantId: 'tenant-1',
    });
  });

  it('should return created/updated/deleted data on repository success', async () => {
    await expect(createAssetConditionCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: condition,
    });
    await expect(updateAssetConditionCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: condition,
    });
    await expect(deleteAssetConditionCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: condition,
    });
  });

  it('should map known Postgres unique constraint 23505 for name index to conflict error', async () => {
    repo.createAssetCondition.mockRejectedValue({
      code: '23505',
      constraint: 'asset_condition_tenant_name_idx',
    });
    await expect(createAssetConditionCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset condition name 'Good' already exists."],
    });
  });

  it('should map known Postgres unique constraint 23505 for code index to conflict error', async () => {
    repo.updateAssetCondition.mockRejectedValue({
      code: '23505',
      constraint: 'asset_condition_tenant_code_idx',
    });
    await expect(updateAssetConditionCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset condition code 'GD' already exists."],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createAssetCondition.mockRejectedValue(error);
    await expect(createAssetConditionCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should return not found when update repository reports no row', async () => {
    repo.updateAssetCondition.mockResolvedValue(undefined);
    await expect(updateAssetConditionCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Asset condition not found'],
    });
  });

  it('should return not found when delete repository reports no row', async () => {
    repo.deleteAssetCondition.mockResolvedValue(undefined);
    await expect(deleteAssetConditionCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Asset condition not found'],
    });
  });

  it('should preserve validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateAssetConditionCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
  });
});
