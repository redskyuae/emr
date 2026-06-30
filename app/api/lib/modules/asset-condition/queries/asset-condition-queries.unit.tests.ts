import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assetConditionRepository } from '../repository/asset-condition-repository';
import { validateGetAssetConditionById } from '../validator/get-asset-condition-by-id-validator';
import { validateGetAssetConditions } from '../validator/get-asset-conditions-validator';
import { getAssetConditionByIdQuery } from './get-asset-condition-by-id-query';
import { getAssetConditionsQuery } from './get-asset-conditions-query';

vi.mock('../repository/asset-condition-repository', () => ({
  assetConditionRepository: {
    getAssetConditionById: vi.fn(),
    getAssetConditions: vi.fn(),
  },
}));
vi.mock('../validator/get-asset-condition-by-id-validator', () => ({
  validateGetAssetConditionById: vi.fn(),
}));
vi.mock('../validator/get-asset-conditions-validator', () => ({
  validateGetAssetConditions: vi.fn(),
}));

const repo = vi.mocked(assetConditionRepository);
const validateById = vi.mocked(validateGetAssetConditionById);
const validateList = vi.mocked(validateGetAssetConditions);
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

describe('AssetCondition queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getAssetConditionById.mockResolvedValue(condition);
    repo.getAssetConditions.mockResolvedValue({ data: [condition], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getAssetConditionByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getAssetConditionById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getAssetConditionByIdQuery('1', 'tenant-1');
    expect(repo.getAssetConditionById).toHaveBeenCalledWith(1, 'tenant-1');
    await getAssetConditionsQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'go' });
    expect(repo.getAssetConditions).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'go',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getAssetConditionsQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [condition],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getAssetConditionByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: condition,
    });
  });

  it('should return not found when get-by-id repository returns nothing', async () => {
    repo.getAssetConditionById.mockResolvedValue(undefined);
    const result = await getAssetConditionByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });

  it('should not call list repository when tenant validation fails', async () => {
    validateList.mockReturnValue({ success: false, errors: ['Tenant ID cannot be empty'] });
    const result = await getAssetConditionsQuery({ tenantId: '  ' });
    expect(result).toEqual({ success: false, errors: ['Tenant ID cannot be empty'] });
    expect(repo.getAssetConditions).not.toHaveBeenCalled();
  });
});
