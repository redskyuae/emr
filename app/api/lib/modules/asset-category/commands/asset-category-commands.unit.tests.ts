import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assetCategoryRepository } from '../repository/asset-category-repository';
import { validateCreateAssetCategory } from '../validator/create-asset-category-validator';
import { validateDeleteAssetCategory } from '../validator/delete-asset-category-validator';
import { validateUpdateAssetCategory } from '../validator/update-asset-category-validator';
import { createAssetCategoryCommand } from './create-asset-category-command';
import { deleteAssetCategoryCommand } from './delete-asset-category-command';
import { updateAssetCategoryCommand } from './update-asset-category-command';

vi.mock('../repository/asset-category-repository', () => ({
  assetCategoryRepository: {
    createAssetCategory: vi.fn(),
    updateAssetCategory: vi.fn(),
    deleteAssetCategory: vi.fn(),
  },
}));
vi.mock('../validator/create-asset-category-validator', () => ({
  validateCreateAssetCategory: vi.fn(),
}));
vi.mock('../validator/update-asset-category-validator', () => ({
  validateUpdateAssetCategory: vi.fn(),
}));
vi.mock('../validator/delete-asset-category-validator', () => ({
  validateDeleteAssetCategory: vi.fn(),
}));

const repo = vi.mocked(assetCategoryRepository);
const validateCreate = vi.mocked(validateCreateAssetCategory);
const validateUpdate = vi.mocked(validateUpdateAssetCategory);
const validateDelete = vi.mocked(validateDeleteAssetCategory);
const condition = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Good',
  code: 'GD',
  color: '#2563EB',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AssetCategory commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { name: 'Good', code: 'GD', color: '#2563EB', description: undefined },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        payload: { name: 'Good', code: 'GD', color: '#2563EB', description: undefined },
      },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createAssetCategory.mockResolvedValue(condition);
    repo.updateAssetCategory.mockResolvedValue(condition);
    repo.deleteAssetCategory.mockResolvedValue(condition);
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createAssetCategoryCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createAssetCategory).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on success', async () => {
    await createAssetCategoryCommand({}, 'tenant-1');
    expect(repo.createAssetCategory).toHaveBeenCalledWith({
      name: 'Good',
      code: 'GD',
      color: '#2563EB',
      description: undefined,
      tenantId: 'tenant-1',
    });
  });

  it('should return created/updated/deleted data on repository success', async () => {
    await expect(createAssetCategoryCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: condition,
    });
    await expect(updateAssetCategoryCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: condition,
    });
    await expect(deleteAssetCategoryCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: condition,
    });
  });

  it('should map known Postgres unique constraint 23505 for name index to conflict error', async () => {
    repo.createAssetCategory.mockRejectedValue({
      code: '23505',
      constraint: 'asset_category_tenant_name_idx',
    });
    await expect(createAssetCategoryCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset category name 'Good' already exists."],
    });
  });

  it('should map known Postgres unique constraint 23505 for code index to conflict error', async () => {
    repo.updateAssetCategory.mockRejectedValue({
      code: '23505',
      constraint: 'asset_category_tenant_code_idx',
    });
    await expect(updateAssetCategoryCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset category code 'GD' already exists."],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createAssetCategory.mockRejectedValue(error);
    await expect(createAssetCategoryCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should return not found when update repository reports no row', async () => {
    repo.updateAssetCategory.mockResolvedValue(undefined);
    await expect(updateAssetCategoryCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Asset category not found'],
    });
  });

  it('should return not found when delete repository reports no row', async () => {
    repo.deleteAssetCategory.mockResolvedValue(undefined);
    await expect(deleteAssetCategoryCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Asset category not found'],
    });
  });

  it('should preserve validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateAssetCategoryCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
  });
});
