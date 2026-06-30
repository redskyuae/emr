import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assetRepository } from '../repository/asset-repository';
import { getAssetByIdQuery } from './get-asset-by-id-query';
import { getAssetsQuery } from './get-assets-query';

vi.mock('../repository/asset-repository', () => ({
  assetRepository: { getAssetById: vi.fn(), getAssets: vi.fn() },
}));

const repo = vi.mocked(assetRepository);
const asset = {
  id: 1,
  name: 'MRI Scanner',
  serialNumber: 'SN-1',
  categoryId: 1,
  statusId: 2,
  conditionId: null,
  tenantId: 'tenant-1',
  manufacturer: null,
  model: null,
  facility: null,
  department: null,
  location: null,
  custodian: null,
  cost: null,
  currentValue: null,
  purchaseDate: null,
  warrantyExpiry: null,
  lastServiceDate: null,
  nextServiceDate: null,
  calibrationDate: null,
  category: { id: 1, name: 'Imaging', color: '#2563EB' },
  status: { id: 2, name: 'Active', color: '#16A34A' },
  condition: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('Asset queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getAssetById.mockResolvedValue(asset);
    repo.getAssets.mockResolvedValue({ data: [asset], total: 1 });
  });

  it('should return invalid-id error and not call repository when id is invalid', async () => {
    const result = await getAssetByIdQuery('abc', 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: ['Asset abc is Invalid.'],
    });
    expect(repo.getAssetById).not.toHaveBeenCalled();
  });

  it('should return the asset on success', async () => {
    await expect(getAssetByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: asset,
    });
    expect(repo.getAssetById).toHaveBeenCalledWith(1, 'tenant-1');
  });

  it('should return not found when the repository returns nothing', async () => {
    repo.getAssetById.mockResolvedValue(undefined);
    const result = await getAssetByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });

  it('should return invalid tenant error and not call repository for the list query', async () => {
    const result = await getAssetsQuery({ tenantId: '   ' });
    expect(result).toMatchObject({ success: false });
    expect(repo.getAssets).not.toHaveBeenCalled();
  });

  it('should return list data and pass filters through', async () => {
    const result = await getAssetsQuery({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'mri',
      categoryId: 1,
      statusId: 2,
    });
    expect(result).toEqual({ success: true, data: [asset], total: 1 });
    expect(repo.getAssets).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'mri',
      categoryId: 1,
      statusId: 2,
    });
  });
});
