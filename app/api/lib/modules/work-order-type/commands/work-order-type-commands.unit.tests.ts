import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { workOrderTypeRepository } from '../repository/work-order-type-repository';
import { validateCreateWorkOrderType } from '../validator/create-work-order-type-validator';
import { validateDeleteWorkOrderType } from '../validator/delete-work-order-type-validator';
import { validateUpdateWorkOrderType } from '../validator/update-work-order-type-validator';
import { createWorkOrderTypeCommand } from './create-work-order-type-command';
import { deleteWorkOrderTypeCommand } from './delete-work-order-type-command';
import { updateWorkOrderTypeCommand } from './update-work-order-type-command';

vi.mock('../repository/work-order-type-repository', () => ({
  workOrderTypeRepository: {
    createWorkOrderType: vi.fn(),
    updateWorkOrderType: vi.fn(),
    deleteWorkOrderType: vi.fn(),
  },
}));
vi.mock('../validator/create-work-order-type-validator', () => ({
  validateCreateWorkOrderType: vi.fn(),
}));
vi.mock('../validator/update-work-order-type-validator', () => ({
  validateUpdateWorkOrderType: vi.fn(),
}));
vi.mock('../validator/delete-work-order-type-validator', () => ({
  validateDeleteWorkOrderType: vi.fn(),
}));

const repo = vi.mocked(workOrderTypeRepository);
const validateCreate = vi.mocked(validateCreateWorkOrderType);
const validateUpdate = vi.mocked(validateUpdateWorkOrderType);
const validateDelete = vi.mocked(validateDeleteWorkOrderType);
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

describe('WorkOrderType commands', () => {
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
    validateDelete.mockResolvedValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createWorkOrderType.mockResolvedValue(condition);
    repo.updateWorkOrderType.mockResolvedValue(condition);
    repo.deleteWorkOrderType.mockResolvedValue({ outcome: 'deleted', data: condition });
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createWorkOrderTypeCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createWorkOrderType).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on success', async () => {
    await createWorkOrderTypeCommand({}, 'tenant-1');
    expect(repo.createWorkOrderType).toHaveBeenCalledWith({
      name: 'Good',
      code: 'GD',
      color: '#16A34A',
      description: undefined,
      tenantId: 'tenant-1',
    });
  });

  it('should return created/updated/deleted data on repository success', async () => {
    await expect(createWorkOrderTypeCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: condition,
    });
    await expect(updateWorkOrderTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: condition,
    });
    await expect(deleteWorkOrderTypeCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: condition,
    });
  });

  it('should map known Postgres unique constraint 23505 for name index to conflict error', async () => {
    repo.createWorkOrderType.mockRejectedValue({
      code: '23505',
      constraint: 'work_order_type_tenant_name_idx',
    });
    await expect(createWorkOrderTypeCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Work order type name 'Good' already exists."],
    });
  });

  it('should map known Postgres unique constraint 23505 for code index to conflict error', async () => {
    repo.updateWorkOrderType.mockRejectedValue({
      code: '23505',
      constraint: 'work_order_type_tenant_code_idx',
    });
    await expect(updateWorkOrderTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Work order type code 'GD' already exists."],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createWorkOrderType.mockRejectedValue(error);
    await expect(createWorkOrderTypeCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should return not found when update repository reports no row', async () => {
    repo.updateWorkOrderType.mockResolvedValue(undefined);
    await expect(updateWorkOrderTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Work order type not found'],
    });
  });

  it('should return not found when delete repository reports no row', async () => {
    repo.deleteWorkOrderType.mockResolvedValue({ outcome: 'not-found' });
    await expect(deleteWorkOrderTypeCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Work order type not found'],
    });
  });

  it('should return conflict when delete repository reports in-use', async () => {
    repo.deleteWorkOrderType.mockResolvedValue({ outcome: 'in-use' });
    await expect(deleteWorkOrderTypeCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Work order type cannot be deleted while it is in use.'],
    });
  });

  it('should preserve validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateWorkOrderTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
  });
});
