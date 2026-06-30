import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { workOrderPriorityRepository } from '../repository/work-order-priority-repository';
import { validateCreateWorkOrderPriority } from '../validator/create-work-order-priority-validator';
import { validateDeleteWorkOrderPriority } from '../validator/delete-work-order-priority-validator';
import { validateUpdateWorkOrderPriority } from '../validator/update-work-order-priority-validator';
import { createWorkOrderPriorityCommand } from './create-work-order-priority-command';
import { deleteWorkOrderPriorityCommand } from './delete-work-order-priority-command';
import { updateWorkOrderPriorityCommand } from './update-work-order-priority-command';

vi.mock('../repository/work-order-priority-repository', () => ({
  workOrderPriorityRepository: {
    createWorkOrderPriority: vi.fn(),
    updateWorkOrderPriority: vi.fn(),
    deleteWorkOrderPriority: vi.fn(),
  },
}));
vi.mock('../validator/create-work-order-priority-validator', () => ({
  validateCreateWorkOrderPriority: vi.fn(),
}));
vi.mock('../validator/update-work-order-priority-validator', () => ({
  validateUpdateWorkOrderPriority: vi.fn(),
}));
vi.mock('../validator/delete-work-order-priority-validator', () => ({
  validateDeleteWorkOrderPriority: vi.fn(),
}));

const repo = vi.mocked(workOrderPriorityRepository);
const validateCreate = vi.mocked(validateCreateWorkOrderPriority);
const validateUpdate = vi.mocked(validateUpdateWorkOrderPriority);
const validateDelete = vi.mocked(validateDeleteWorkOrderPriority);
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

describe('WorkOrderPriority commands', () => {
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
    repo.createWorkOrderPriority.mockResolvedValue(condition);
    repo.updateWorkOrderPriority.mockResolvedValue(condition);
    repo.deleteWorkOrderPriority.mockResolvedValue({ outcome: 'deleted', data: condition });
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createWorkOrderPriorityCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createWorkOrderPriority).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on success', async () => {
    await createWorkOrderPriorityCommand({}, 'tenant-1');
    expect(repo.createWorkOrderPriority).toHaveBeenCalledWith({
      name: 'Good',
      code: 'GD',
      color: '#16A34A',
      description: undefined,
      tenantId: 'tenant-1',
    });
  });

  it('should return created/updated/deleted data on repository success', async () => {
    await expect(createWorkOrderPriorityCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: condition,
    });
    await expect(updateWorkOrderPriorityCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: condition,
    });
    await expect(deleteWorkOrderPriorityCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: condition,
    });
  });

  it('should map known Postgres unique constraint 23505 for name index to conflict error', async () => {
    repo.createWorkOrderPriority.mockRejectedValue({
      code: '23505',
      constraint: 'work_order_priority_tenant_name_idx',
    });
    await expect(createWorkOrderPriorityCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Work order priority name 'Good' already exists."],
    });
  });

  it('should map known Postgres unique constraint 23505 for code index to conflict error', async () => {
    repo.updateWorkOrderPriority.mockRejectedValue({
      code: '23505',
      constraint: 'work_order_priority_tenant_code_idx',
    });
    await expect(updateWorkOrderPriorityCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Work order priority code 'GD' already exists."],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createWorkOrderPriority.mockRejectedValue(error);
    await expect(createWorkOrderPriorityCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should return not found when update repository reports no row', async () => {
    repo.updateWorkOrderPriority.mockResolvedValue(undefined);
    await expect(updateWorkOrderPriorityCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Work order priority not found'],
    });
  });

  it('should return not found when delete repository reports no row', async () => {
    repo.deleteWorkOrderPriority.mockResolvedValue({ outcome: 'not-found' });
    await expect(deleteWorkOrderPriorityCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Work order priority not found'],
    });
  });

  it('should return conflict when delete repository reports in-use', async () => {
    repo.deleteWorkOrderPriority.mockResolvedValue({ outcome: 'in-use' });
    await expect(deleteWorkOrderPriorityCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Work order priority cannot be deleted while it is in use.'],
    });
  });

  it('should preserve validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateWorkOrderPriorityCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
  });
});
