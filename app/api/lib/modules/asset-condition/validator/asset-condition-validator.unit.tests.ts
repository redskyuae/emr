import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assetConditionRepository } from '../repository/asset-condition-repository';
import { validateCreateAssetCondition } from './create-asset-condition-validator';
import { validateDeleteAssetCondition } from './delete-asset-condition-validator';
import { validateGetAssetConditionById } from './get-asset-condition-by-id-validator';
import { validateGetAssetConditions } from './get-asset-conditions-validator';
import { validateUpdateAssetCondition } from './update-asset-condition-validator';

vi.mock('../repository/asset-condition-repository', () => ({
  assetConditionRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getAssetConditionById: vi.fn(),
  },
}));

const repo = vi.mocked(assetConditionRepository);
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

describe('AssetCondition validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getAssetConditionById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateCreateAssetCondition({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Asset condition name is required']),
    });
  });

  it('should not call uniqueness repository checks when schema validation fails', async () => {
    await validateCreateAssetCondition({}, 'tenant-1');
    expect(repo.findActiveByName).not.toHaveBeenCalled();
    expect(repo.findActiveByCode).not.toHaveBeenCalled();
  });

  it('should return conflict when active asset condition name already exists for tenant', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateAssetCondition(
      { name: 'Good', code: 'GD', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset condition name 'Good' already exists."],
    });
  });

  it('should return conflict when active asset condition code already exists for tenant', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAssetCondition(
      { name: 'Good', code: 'GD', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset condition code 'GD' already exists."],
    });
  });

  it('should return all duplicate errors when both name and code already exist', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAssetCondition(
      { name: 'Good', code: 'GD', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: [
        "Asset condition name 'Good' already exists.",
        "Asset condition code 'GD' already exists.",
      ],
    });
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateAssetCondition(
      '7',
      { name: 'Worn', code: 'wr', color: '#16A34A' },
      'tenant-1'
    );
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Worn', { excludeId: 7 });
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'WR', { excludeId: 7 });
  });

  it('should return invalid id error from update validator when id cannot be parsed', async () => {
    const result = await validateUpdateAssetCondition(
      'abc',
      { name: 'Worn', code: 'WR', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Asset condition abc is Invalid.']),
    });
  });

  it('should return not found from update validator when entity does not exist', async () => {
    repo.getAssetConditionById.mockResolvedValue(undefined);
    const result = await validateUpdateAssetCondition(
      '1',
      { name: 'Worn', code: 'WR', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return parsed/transformed data on create success', async () => {
    await expect(
      validateCreateAssetCondition({ name: ' Worn ', code: 'wr', color: '#16A34A' }, 'tenant-1')
    ).resolves.toEqual({ success: true, data: { name: 'Worn', code: 'WR', color: '#16A34A' } });
  });

  it('should preserve validator status on failure', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAssetCondition(
      { name: 'Worn', code: 'WR', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({ status: StatusCodes.CONFLICT });
  });

  it('should validate delete inputs and reject invalid id', () => {
    expect(validateDeleteAssetCondition('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateDeleteAssetCondition('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Asset condition abc is Invalid.'],
    });
  });

  it('should validate get-by-id inputs and reject empty tenant', () => {
    expect(validateGetAssetConditionById('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetAssetConditionById('1', '  ')).toMatchObject({ success: false });
  });

  it('should validate list tenant input', () => {
    expect(validateGetAssetConditions('tenant-1')).toEqual({ success: true, data: 'tenant-1' });
    expect(validateGetAssetConditions('  ')).toMatchObject({
      success: false,
      errors: ['Tenant ID cannot be empty'],
    });
  });
});
