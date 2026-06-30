import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { workOrderStatusRepository } from '../repository/work-order-status-repository';
import { validateCreateWorkOrderStatus } from '../validator/create-work-order-status-validator';
import { validateDeleteWorkOrderStatus } from '../validator/delete-work-order-status-validator';
import { validateUpdateWorkOrderStatus } from '../validator/update-work-order-status-validator';
import { createWorkOrderStatusCommand } from './create-work-order-status-command';
import { deleteWorkOrderStatusCommand } from './delete-work-order-status-command';
import { updateWorkOrderStatusCommand } from './update-work-order-status-command';

vi.mock('../repository/work-order-status-repository', () => ({
  workOrderStatusRepository: {
    createWorkOrderStatus: vi.fn(),
    updateWorkOrderStatus: vi.fn(),
    deleteWorkOrderStatus: vi.fn(),
  },
}));
vi.mock('../validator/create-work-order-status-validator', () => ({
  validateCreateWorkOrderStatus: vi.fn(),
}));
vi.mock('../validator/update-work-order-status-validator', () => ({
  validateUpdateWorkOrderStatus: vi.fn(),
}));
vi.mock('../validator/delete-work-order-status-validator', () => ({
  validateDeleteWorkOrderStatus: vi.fn(),
}));

const repo = vi.mocked(workOrderStatusRepository);
const validateCreate = vi.mocked(validateCreateWorkOrderStatus);
const validateUpdate = vi.mocked(validateUpdateWorkOrderStatus);
const validateDelete = vi.mocked(validateDeleteWorkOrderStatus);
const status = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Open',
  code: 'OPN',
  color: '#16A34A',
  category: 'OPEN' as const,
  isSystem: false,
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};
const payload = {
  name: 'Open',
  code: 'OPN',
  color: '#16A34A',
  category: 'OPEN' as const,
  description: undefined,
};

describe('WorkOrderStatus commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: payload });
    validateUpdate.mockResolvedValue({ success: true, data: { id: 1, payload } });
    validateDelete.mockResolvedValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createWorkOrderStatus.mockResolvedValue(status);
    repo.updateWorkOrderStatus.mockResolvedValue({ outcome: 'updated', data: status });
    repo.deleteWorkOrderStatus.mockResolvedValue({ outcome: 'deleted', data: status });
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createWorkOrderStatusCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createWorkOrderStatus).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on create', async () => {
    await createWorkOrderStatusCommand({}, 'tenant-1');
    expect(repo.createWorkOrderStatus).toHaveBeenCalledWith({ ...payload, tenantId: 'tenant-1' });
  });

  it('should return created data on repository success', async () => {
    await expect(createWorkOrderStatusCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: status,
    });
  });

  it('should map known Postgres unique constraint 23505 on create to conflict error', async () => {
    repo.createWorkOrderStatus.mockRejectedValue({
      code: '23505',
      constraint: 'work_order_status_tenant_name_idx',
    });
    await expect(createWorkOrderStatusCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Work order status name 'Open' already exists."],
    });
  });

  it('should rethrow unknown repository errors on create', async () => {
    const error = new Error('database down');
    repo.createWorkOrderStatus.mockRejectedValue(error);
    await expect(createWorkOrderStatusCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should return updated data when update outcome is updated', async () => {
    await expect(updateWorkOrderStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: status,
    });
  });

  it('should map update outcome in-use to conflict error', async () => {
    repo.updateWorkOrderStatus.mockResolvedValue({ outcome: 'in-use' });
    await expect(updateWorkOrderStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Work order status category cannot be changed while the status is in use.'],
    });
  });

  it('should map update outcome not-found to not found error', async () => {
    repo.updateWorkOrderStatus.mockResolvedValue({ outcome: 'not-found' });
    await expect(updateWorkOrderStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Work order status not found'],
    });
  });

  it('should preserve update validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateWorkOrderStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
  });

  it('should return deleted data when delete outcome is deleted', async () => {
    await expect(deleteWorkOrderStatusCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: status,
    });
  });

  it('should map delete outcome in-use to conflict error', async () => {
    repo.deleteWorkOrderStatus.mockResolvedValue({ outcome: 'in-use' });
    await expect(deleteWorkOrderStatusCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Work order status cannot be deleted while it is in use.'],
    });
  });

  it('should map delete outcome not-found to not found error', async () => {
    repo.deleteWorkOrderStatus.mockResolvedValue({ outcome: 'not-found' });
    await expect(deleteWorkOrderStatusCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Work order status not found'],
    });
  });
});
