import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assetRepository } from '../repository/asset-repository';
import { validateCreateAsset } from '../validator/create-asset-validator';
import { validateDeleteAsset } from '../validator/delete-asset-validator';
import { validateUpdateAsset } from '../validator/update-asset-validator';
import { createAssetCommand } from './create-asset-command';
import { deleteAssetCommand } from './delete-asset-command';
import { updateAssetCommand } from './update-asset-command';

vi.mock('../repository/asset-repository', () => ({
  assetRepository: { createAsset: vi.fn(), updateAsset: vi.fn(), deleteAsset: vi.fn() },
}));
vi.mock('../validator/create-asset-validator', () => ({ validateCreateAsset: vi.fn() }));
vi.mock('../validator/update-asset-validator', () => ({ validateUpdateAsset: vi.fn() }));
vi.mock('../validator/delete-asset-validator', () => ({ validateDeleteAsset: vi.fn() }));

const repo = vi.mocked(assetRepository);
const validateCreate = vi.mocked(validateCreateAsset);
const validateUpdate = vi.mocked(validateUpdateAsset);
const validateDelete = vi.mocked(validateDeleteAsset);
const createInput = { name: 'MRI Scanner', categoryId: 1, statusId: 2, serialNumber: 'SN-1' };
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

describe('Asset commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: createInput as never });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 1, payload: createInput as never },
    });
    validateDelete.mockResolvedValue({ success: true, data: 1 });
    repo.createAsset.mockResolvedValue(asset);
    repo.updateAsset.mockResolvedValue(asset);
    repo.deleteAsset.mockResolvedValue({ outcome: 'deleted', data: { id: 1 } });
  });

  it('should return validation failure and not write when create validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createAssetCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createAsset).not.toHaveBeenCalled();
  });

  it('should create the asset with tenant id on success', async () => {
    await expect(createAssetCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: asset,
    });
    expect(repo.createAsset).toHaveBeenCalledWith({ ...createInput, tenantId: 'tenant-1' });
  });

  it('should return not found when create repository returns nothing', async () => {
    repo.createAsset.mockResolvedValue(undefined);
    await expect(createAssetCommand({}, 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should map a duplicate serial number constraint on create to a conflict error', async () => {
    repo.createAsset.mockRejectedValue({ code: '23505', constraint: 'asset_tenant_serial_idx' });
    await expect(createAssetCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset serial number 'SN-1' already exists."],
    });
  });

  it('should rethrow unknown create errors', async () => {
    const error = new Error('database down');
    repo.createAsset.mockRejectedValue(error);
    await expect(createAssetCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should update the asset on success', async () => {
    await expect(updateAssetCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: asset,
    });
  });

  it('should return not found when update repository returns nothing', async () => {
    repo.updateAsset.mockResolvedValue(undefined);
    await expect(updateAssetCommand('1', 'tenant-1', {})).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should map a duplicate serial number constraint on update to a conflict error', async () => {
    repo.updateAsset.mockRejectedValue({ code: '23505', constraint: 'asset_tenant_serial_idx' });
    await expect(updateAssetCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset serial number 'SN-1' already exists."],
    });
  });

  it('should delete the asset on success', async () => {
    await expect(deleteAssetCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: undefined,
    });
  });

  it('should map a delete in-use outcome to a conflict error', async () => {
    repo.deleteAsset.mockResolvedValue({ outcome: 'in-use' });
    await expect(deleteAssetCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Asset cannot be deleted while it has active work orders.'],
    });
  });

  it('should map a delete not-found outcome to a not found error', async () => {
    repo.deleteAsset.mockResolvedValue({ outcome: 'not-found' });
    await expect(deleteAssetCommand('1', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should return validation failure when delete validator fails', async () => {
    validateDelete.mockResolvedValue({ success: false, errors: ['Asset abc is Invalid.'] });
    const result = await deleteAssetCommand('abc', 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Asset abc is Invalid.'] });
    expect(repo.deleteAsset).not.toHaveBeenCalled();
  });
});
