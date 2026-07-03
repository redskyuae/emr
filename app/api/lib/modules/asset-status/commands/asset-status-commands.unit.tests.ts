import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assetStatusRepository } from '../repository/asset-status-repository';
import { validateCreateAssetStatus } from '../validator/create-asset-status-validator';
import { validateDeleteAssetStatus } from '../validator/delete-asset-status-validator';
import { validateUpdateAssetStatus } from '../validator/update-asset-status-validator';
import { createAssetStatusCommand } from './create-asset-status-command';
import { deleteAssetStatusCommand } from './delete-asset-status-command';
import { updateAssetStatusCommand } from './update-asset-status-command';

vi.mock('../repository/asset-status-repository', () => ({
  assetStatusRepository: {
    createAssetStatus: vi.fn(),
    updateAssetStatus: vi.fn(),
    deleteAssetStatus: vi.fn(),
  },
}));
vi.mock('../validator/create-asset-status-validator', () => ({
  validateCreateAssetStatus: vi.fn(),
}));
vi.mock('../validator/update-asset-status-validator', () => ({
  validateUpdateAssetStatus: vi.fn(),
}));
vi.mock('../validator/delete-asset-status-validator', () => ({
  validateDeleteAssetStatus: vi.fn(),
}));

const repo = vi.mocked(assetStatusRepository);
const validateCreate = vi.mocked(validateCreateAssetStatus);
const validateUpdate = vi.mocked(validateUpdateAssetStatus);
const validateDelete = vi.mocked(validateDeleteAssetStatus);
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

describe('AssetStatus commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { name: 'Good', code: 'GD', color: '#16A34A', description: undefined },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        payload: { name: 'Good', code: 'GD', color: '#16A34A', description: undefined },
      },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createAssetStatus.mockResolvedValue(condition);
    repo.updateAssetStatus.mockResolvedValue(condition);
    repo.deleteAssetStatus.mockResolvedValue(condition);
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createAssetStatusCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createAssetStatus).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on success', async () => {
    await createAssetStatusCommand({}, 'tenant-1');
    expect(repo.createAssetStatus).toHaveBeenCalledWith({
      name: 'Good',
      code: 'GD',
      color: '#16A34A',
      description: undefined,
      tenantId: 'tenant-1',
    });
  });

  it('should return created/updated/deleted data on repository success', async () => {
    await expect(createAssetStatusCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: condition,
    });
    await expect(updateAssetStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: condition,
    });
    await expect(deleteAssetStatusCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: condition,
    });
  });

  it('should map known Postgres unique constraint 23505 for name index to conflict error', async () => {
    repo.createAssetStatus.mockRejectedValue({
      code: '23505',
      constraint: 'asset_status_tenant_name_idx',
    });
    await expect(createAssetStatusCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset status name 'Good' already exists."],
    });
  });

  it('should map known Postgres unique constraint 23505 for code index to conflict error', async () => {
    repo.updateAssetStatus.mockRejectedValue({
      code: '23505',
      constraint: 'asset_status_tenant_code_idx',
    });
    await expect(updateAssetStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Asset status code 'GD' already exists."],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createAssetStatus.mockRejectedValue(error);
    await expect(createAssetStatusCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should return not found when update repository reports no row', async () => {
    repo.updateAssetStatus.mockResolvedValue(undefined);
    await expect(updateAssetStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Asset status not found'],
    });
  });

  it('should return not found when delete repository reports no row', async () => {
    repo.deleteAssetStatus.mockResolvedValue(undefined);
    await expect(deleteAssetStatusCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Asset status not found'],
    });
  });

  it('should preserve validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateAssetStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
  });
});
