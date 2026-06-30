import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assetStatusRepository } from '../repository/asset-status-repository';
import { validateGetAssetStatusById } from '../validator/get-asset-status-by-id-validator';
import { validateGetAssetStatuses } from '../validator/get-asset-statuses-validator';
import { getAssetStatusByIdQuery } from './get-asset-status-by-id-query';
import { getAssetStatusesQuery } from './get-asset-statuses-query';

vi.mock('../repository/asset-status-repository', () => ({
  assetStatusRepository: {
    getAssetStatusById: vi.fn(),
    getAssetStatuses: vi.fn(),
  },
}));
vi.mock('../validator/get-asset-status-by-id-validator', () => ({
  validateGetAssetStatusById: vi.fn(),
}));
vi.mock('../validator/get-asset-statuses-validator', () => ({
  validateGetAssetStatuses: vi.fn(),
}));

const repo = vi.mocked(assetStatusRepository);
const validateById = vi.mocked(validateGetAssetStatusById);
const validateList = vi.mocked(validateGetAssetStatuses);
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

describe('AssetStatus queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getAssetStatusById.mockResolvedValue(condition);
    repo.getAssetStatuses.mockResolvedValue({ data: [condition], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getAssetStatusByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getAssetStatusById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getAssetStatusByIdQuery('1', 'tenant-1');
    expect(repo.getAssetStatusById).toHaveBeenCalledWith(1, 'tenant-1');
    await getAssetStatusesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'go' });
    expect(repo.getAssetStatuses).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'go',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getAssetStatusesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [condition],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getAssetStatusByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: condition,
    });
  });

  it('should return not found when get-by-id repository returns nothing', async () => {
    repo.getAssetStatusById.mockResolvedValue(undefined);
    const result = await getAssetStatusByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });

  it('should not call list repository when tenant validation fails', async () => {
    validateList.mockReturnValue({ success: false, errors: ['Tenant ID cannot be empty'] });
    const result = await getAssetStatusesQuery({ tenantId: '  ' });
    expect(result).toEqual({ success: false, errors: ['Tenant ID cannot be empty'] });
    expect(repo.getAssetStatuses).not.toHaveBeenCalled();
  });
});
