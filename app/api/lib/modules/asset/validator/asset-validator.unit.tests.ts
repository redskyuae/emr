import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assetCategoryRepository } from '../../asset-category/repository/asset-category-repository';
import { assetConditionRepository } from '../../asset-condition/repository/asset-condition-repository';
import { assetStatusRepository } from '../../asset-status/repository/asset-status-repository';
import { assetRepository } from '../repository/asset-repository';
import { validateAssetReferences } from './asset-reference-validator';
import { validateAssetSerialNumberUniqueness } from './asset-serial-number-validator';
import { validateCreateAsset } from './create-asset-validator';
import { validateDeleteAsset } from './delete-asset-validator';
import { validateGetAssetById } from './get-asset-by-id-validator';
import { validateUpdateAsset } from './update-asset-validator';

vi.mock('../../asset-category/repository/asset-category-repository', () => ({
  assetCategoryRepository: { getAssetCategoryById: vi.fn() },
}));
vi.mock('../../asset-condition/repository/asset-condition-repository', () => ({
  assetConditionRepository: { getAssetConditionById: vi.fn() },
}));
vi.mock('../../asset-status/repository/asset-status-repository', () => ({
  assetStatusRepository: { getAssetStatusById: vi.fn() },
}));
vi.mock('../repository/asset-repository', () => ({
  assetRepository: { findActiveBySerialNumber: vi.fn(), getAssetById: vi.fn() },
}));

const categoryRepo = vi.mocked(assetCategoryRepository);
const conditionRepo = vi.mocked(assetConditionRepository);
const statusRepo = vi.mocked(assetStatusRepository);
const repo = vi.mocked(assetRepository);
const payload = { name: 'MRI Scanner', categoryId: 1, statusId: 2, serialNumber: 'SN-1' };

describe('Asset validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryRepo.getAssetCategoryById.mockResolvedValue({ id: 1 } as never);
    statusRepo.getAssetStatusById.mockResolvedValue({ id: 2 } as never);
    conditionRepo.getAssetConditionById.mockResolvedValue({ id: 3 } as never);
    repo.findActiveBySerialNumber.mockResolvedValue(undefined);
    repo.getAssetById.mockResolvedValue({ id: 1 } as never);
  });

  it('should flag invalid category and status references', async () => {
    categoryRepo.getAssetCategoryById.mockResolvedValue(undefined);
    statusRepo.getAssetStatusById.mockResolvedValue(undefined);
    const result = await validateAssetReferences({ categoryId: 1, statusId: 2 }, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Asset category 1 is Invalid.', 'Asset status 2 is Invalid.'],
    });
  });

  it('should flag an invalid condition reference only when provided', async () => {
    conditionRepo.getAssetConditionById.mockResolvedValue(undefined);
    const result = await validateAssetReferences(
      { categoryId: 1, statusId: 2, conditionId: 9 },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: ['Asset condition 9 is Invalid.'],
    });
  });

  it('should report a duplicate serial number', async () => {
    repo.findActiveBySerialNumber.mockResolvedValue({ id: 2, serialNumber: 'SN-1' });
    const result = await validateAssetSerialNumberUniqueness({
      tenantId: 'tenant-1',
      serialNumber: 'SN-1',
    });
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset serial number 'SN-1' already exists."],
    });
  });

  it('should return schema errors when create payload is invalid', async () => {
    const result = await validateCreateAsset({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Asset name is required']),
    });
  });

  it('should return parsed data on create success', async () => {
    const result = await validateCreateAsset(payload, 'tenant-1');
    expect(result).toMatchObject({
      success: true,
      data: { name: 'MRI Scanner', serialNumber: 'SN-1' },
    });
  });

  it('should propagate a reference failure on create', async () => {
    statusRepo.getAssetStatusById.mockResolvedValue(undefined);
    const result = await validateCreateAsset(payload, 'tenant-1');
    expect(result).toMatchObject({ success: false, errors: ['Asset status 2 is Invalid.'] });
  });

  it('should return invalid id error on update', async () => {
    const result = await validateUpdateAsset('abc', 'tenant-1', payload);
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Asset abc is Invalid.']),
    });
  });

  it('should return not found on update when the asset does not exist', async () => {
    repo.getAssetById.mockResolvedValue(undefined);
    const result = await validateUpdateAsset('1', 'tenant-1', payload);
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should pass exclude id to the serial uniqueness check on update', async () => {
    await validateUpdateAsset('7', 'tenant-1', payload);
    expect(repo.findActiveBySerialNumber).toHaveBeenCalledWith('tenant-1', 'SN-1', {
      excludeId: 7,
    });
  });

  it('should return id and payload on update success', async () => {
    const result = await validateUpdateAsset('7', 'tenant-1', payload);
    expect(result).toMatchObject({ success: true, data: { id: 7 } });
  });

  it('should reject deleting an asset with active work orders', async () => {
    const usage = { hasActiveWorkOrdersForAsset: vi.fn().mockResolvedValue(true) };
    const result = await validateDeleteAsset('1', 'tenant-1', usage);
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Asset cannot be deleted while it has active work orders.'],
    });
  });

  it('should return the id on delete success', async () => {
    const usage = { hasActiveWorkOrdersForAsset: vi.fn().mockResolvedValue(false) };
    await expect(validateDeleteAsset('1', 'tenant-1', usage)).resolves.toEqual({
      success: true,
      data: 1,
    });
  });

  it('should validate get-by-id inputs', () => {
    expect(validateGetAssetById('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetAssetById('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Asset abc is Invalid.'],
    });
  });
});
