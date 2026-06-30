import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assetCategoryRepository } from '../repository/asset-category-repository';
import { validateGetAssetCategoryById } from '../validator/get-asset-category-by-id-validator';
import { validateGetAssetCategories } from '../validator/get-asset-categories-validator';
import { getAssetCategoryByIdQuery } from './get-asset-category-by-id-query';
import { getAssetCategoriesQuery } from './get-asset-categories-query';

vi.mock('../repository/asset-category-repository', () => ({
  assetCategoryRepository: {
    getAssetCategoryById: vi.fn(),
    getAssetCategories: vi.fn(),
  },
}));
vi.mock('../validator/get-asset-category-by-id-validator', () => ({
  validateGetAssetCategoryById: vi.fn(),
}));
vi.mock('../validator/get-asset-categories-validator', () => ({
  validateGetAssetCategories: vi.fn(),
}));

const repo = vi.mocked(assetCategoryRepository);
const validateById = vi.mocked(validateGetAssetCategoryById);
const validateList = vi.mocked(validateGetAssetCategories);
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

describe('AssetCategory queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getAssetCategoryById.mockResolvedValue(condition);
    repo.getAssetCategories.mockResolvedValue({ data: [condition], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'], status: 422 });
    await expect(getAssetCategoryByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getAssetCategoryById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getAssetCategoryByIdQuery('1', 'tenant-1');
    expect(repo.getAssetCategoryById).toHaveBeenCalledWith(1, 'tenant-1');
    await getAssetCategoriesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'go' });
    expect(repo.getAssetCategories).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'go',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getAssetCategoriesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [condition],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getAssetCategoryByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: condition,
    });
  });

  it('should return not found when get-by-id repository returns nothing', async () => {
    repo.getAssetCategoryById.mockResolvedValue(undefined);
    const result = await getAssetCategoryByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });

  it('should not call list repository when tenant validation fails', async () => {
    validateList.mockReturnValue({ success: false, errors: ['Tenant ID cannot be empty'] });
    const result = await getAssetCategoriesQuery({ tenantId: '  ' });
    expect(result).toEqual({ success: false, errors: ['Tenant ID cannot be empty'] });
    expect(repo.getAssetCategories).not.toHaveBeenCalled();
  });
});
