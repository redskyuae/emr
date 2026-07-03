import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assetStatusRepository } from '../repository/asset-status-repository';
import { validateCreateAssetStatus } from './create-asset-status-validator';
import { validateDeleteAssetStatus } from './delete-asset-status-validator';
import { validateGetAssetStatusById } from './get-asset-status-by-id-validator';
import { validateGetAssetStatuses } from './get-asset-statuses-validator';
import { validateUpdateAssetStatus } from './update-asset-status-validator';

vi.mock('../repository/asset-status-repository', () => ({
  assetStatusRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getAssetStatusById: vi.fn(),
  },
}));

const repo = vi.mocked(assetStatusRepository);
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Good',
  code: 'GD',
  color: '#16A34A',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AssetStatus validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getAssetStatusById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateCreateAssetStatus({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Asset status name is required']),
    });
  });

  it('should not call uniqueness repository checks when schema validation fails', async () => {
    await validateCreateAssetStatus({}, 'tenant-1');
    expect(repo.findActiveByName).not.toHaveBeenCalled();
    expect(repo.findActiveByCode).not.toHaveBeenCalled();
  });

  it('should return conflict when active asset status name already exists for tenant', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateAssetStatus(
      { name: 'Good', code: 'GD', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset status name 'Good' already exists."],
    });
  });

  it('should return conflict when active asset status code already exists for tenant', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAssetStatus(
      { name: 'Good', code: 'GD', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset status code 'GD' already exists."],
    });
  });

  it('should return all duplicate errors when both name and code already exist', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAssetStatus(
      { name: 'Good', code: 'GD', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: [
        "Asset status name 'Good' already exists.",
        "Asset status code 'GD' already exists.",
      ],
    });
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateAssetStatus(
      '7',
      { name: 'Worn', code: 'wr', color: '#16A34A' },
      'tenant-1'
    );
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Worn', { excludeId: 7 });
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'WR', { excludeId: 7 });
  });

  it('should return invalid id error from update validator when id cannot be parsed', async () => {
    const result = await validateUpdateAssetStatus(
      'abc',
      { name: 'Worn', code: 'WR', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Asset status abc is Invalid.']),
    });
  });

  it('should return not found from update validator when entity does not exist', async () => {
    repo.getAssetStatusById.mockResolvedValue(undefined);
    const result = await validateUpdateAssetStatus(
      '1',
      { name: 'Worn', code: 'WR', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return parsed/transformed data on create success', async () => {
    await expect(
      validateCreateAssetStatus({ name: ' Worn ', code: 'wr', color: '#16A34A' }, 'tenant-1')
    ).resolves.toEqual({ success: true, data: { name: 'Worn', code: 'WR', color: '#16A34A' } });
  });

  it('should preserve validator status on failure', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAssetStatus(
      { name: 'Worn', code: 'WR', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({ status: StatusCodes.CONFLICT });
  });

  it('should validate delete inputs and reject invalid id', () => {
    expect(validateDeleteAssetStatus('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateDeleteAssetStatus('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Asset status abc is Invalid.'],
    });
  });

  it('should validate get-by-id inputs and reject empty tenant', () => {
    expect(validateGetAssetStatusById('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetAssetStatusById('1', '  ')).toMatchObject({ success: false });
  });

  it('should validate list tenant input', () => {
    expect(validateGetAssetStatuses('tenant-1')).toEqual({ success: true, data: 'tenant-1' });
    expect(validateGetAssetStatuses('  ')).toMatchObject({
      success: false,
      errors: ['Tenant ID cannot be empty'],
    });
  });
});
