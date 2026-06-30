import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assetCategoryRepository } from '../repository/asset-category-repository';
import { validateCreateAssetCategory } from './create-asset-category-validator';
import { validateDeleteAssetCategory } from './delete-asset-category-validator';
import { validateGetAssetCategoryById } from './get-asset-category-by-id-validator';
import { validateGetAssetCategories } from './get-asset-categories-validator';
import { validateUpdateAssetCategory } from './update-asset-category-validator';

vi.mock('../repository/asset-category-repository', () => ({
  assetCategoryRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getAssetCategoryById: vi.fn(),
  },
}));

const repo = vi.mocked(assetCategoryRepository);
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Good',
  code: 'GD',
  color: '#2563EB',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AssetCategory validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getAssetCategoryById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateCreateAssetCategory({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Asset category name is required']),
    });
  });

  it('should not call uniqueness repository checks when schema validation fails', async () => {
    await validateCreateAssetCategory({}, 'tenant-1');
    expect(repo.findActiveByName).not.toHaveBeenCalled();
    expect(repo.findActiveByCode).not.toHaveBeenCalled();
  });

  it('should return conflict when active asset category name already exists for tenant', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateAssetCategory(
      { name: 'Good', code: 'GD', color: '#2563EB' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset category name 'Good' already exists."],
    });
  });

  it('should return conflict when active asset category code already exists for tenant', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAssetCategory(
      { name: 'Good', code: 'GD', color: '#2563EB' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset category code 'GD' already exists."],
    });
  });

  it('should return all duplicate errors when both name and code already exist', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAssetCategory(
      { name: 'Good', code: 'GD', color: '#2563EB' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: [
        "Asset category name 'Good' already exists.",
        "Asset category code 'GD' already exists.",
      ],
    });
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateAssetCategory(
      '7',
      { name: 'Worn', code: 'wr', color: '#2563EB' },
      'tenant-1'
    );
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Worn', { excludeId: 7 });
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'WR', { excludeId: 7 });
  });

  it('should return invalid id error from update validator when id cannot be parsed', async () => {
    const result = await validateUpdateAssetCategory(
      'abc',
      { name: 'Worn', code: 'WR', color: '#2563EB' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Asset category abc is Invalid.']),
    });
  });

  it('should return not found from update validator when entity does not exist', async () => {
    repo.getAssetCategoryById.mockResolvedValue(undefined);
    const result = await validateUpdateAssetCategory(
      '1',
      { name: 'Worn', code: 'WR', color: '#2563EB' },
      'tenant-1'
    );
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return parsed/transformed data on create success', async () => {
    await expect(
      validateCreateAssetCategory({ name: ' Worn ', code: 'wr', color: '#2563EB' }, 'tenant-1')
    ).resolves.toEqual({ success: true, data: { name: 'Worn', code: 'WR', color: '#2563EB' } });
  });

  it('should preserve validator status on failure', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAssetCategory(
      { name: 'Worn', code: 'WR', color: '#2563EB' },
      'tenant-1'
    );
    expect(result).toMatchObject({ status: StatusCodes.CONFLICT });
  });

  it('should validate delete inputs and reject invalid id', () => {
    expect(validateDeleteAssetCategory('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateDeleteAssetCategory('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Asset category abc is Invalid.'],
    });
  });

  it('should validate get-by-id inputs and reject empty tenant', () => {
    expect(validateGetAssetCategoryById('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetAssetCategoryById('1', '  ')).toMatchObject({ success: false });
  });

  it('should validate list tenant input', () => {
    expect(validateGetAssetCategories('tenant-1')).toEqual({ success: true, data: 'tenant-1' });
    expect(validateGetAssetCategories('  ')).toMatchObject({
      success: false,
      errors: ['Tenant ID cannot be empty'],
    });
  });
});
