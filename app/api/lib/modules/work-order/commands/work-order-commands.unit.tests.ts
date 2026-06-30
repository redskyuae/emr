import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { workOrderRepository } from '../repository/work-order-repository';
import { validateCreateWorkOrder } from '../validator/create-work-order-validator';
import { createWorkOrderCommand } from './create-work-order-command';

vi.mock('../repository/work-order-repository', () => ({
  workOrderRepository: { createWorkOrder: vi.fn() },
}));
vi.mock('../validator/create-work-order-validator', () => ({ validateCreateWorkOrder: vi.fn() }));

const repo = vi.mocked(workOrderRepository);
const validateCreate = vi.mocked(validateCreateWorkOrder);
const input = { assetId: 1, typeId: 2, priorityId: 3, statusId: 4 };
const workOrder = {
  id: 1,
  code: 'WO-0001',
  note: null,
  type: { id: 2, name: 'Repair', color: '#2563EB' },
  asset: { id: 1, name: 'MRI Scanner', model: null, serialNumber: 'SN-1' },
  typeId: 2,
  status: { id: 4, name: 'Open', color: '#16A34A', category: 'OPEN' as const },
  assetId: 1,
  dueDate: null,
  tenantId: 'tenant-1',
  statusId: 4,
  priority: { id: 3, name: 'High', color: '#DC2626' },
  createdOn: new Date(),
  priorityId: 3,
  technician: null,
  modifiedOn: new Date(),
  completedOn: null,
};

describe('WorkOrder commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: input });
    repo.createWorkOrder.mockResolvedValue({ success: true, data: workOrder });
  });

  it('should return validation failure and not write when the validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createWorkOrderCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createWorkOrder).not.toHaveBeenCalled();
  });

  it('should create the work order with tenant id on success', async () => {
    await expect(createWorkOrderCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: workOrder,
    });
    expect(repo.createWorkOrder).toHaveBeenCalledWith({ ...input, tenantId: 'tenant-1' });
  });

  it('should map invalid repository references to a conflict error', async () => {
    repo.createWorkOrder.mockResolvedValue({
      success: false,
      invalidReferences: ['asset', 'status'],
    });
    await expect(createWorkOrderCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Asset 1 is Invalid.', 'Work order status 4 is Invalid.'],
    });
  });

  it('should map a duplicate work order code to a conflict error', async () => {
    repo.createWorkOrder.mockRejectedValue({
      code: '23505',
      constraint: 'work_order_tenant_code_idx',
    });
    await expect(createWorkOrderCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Work order code already exists.'],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createWorkOrder.mockRejectedValue(error);
    await expect(createWorkOrderCommand({}, 'tenant-1')).rejects.toThrow(error);
  });
});
