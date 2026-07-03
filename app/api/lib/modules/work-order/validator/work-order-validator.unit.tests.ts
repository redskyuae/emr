import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { validateCreateWorkOrder } from './create-work-order-validator';
import { validateGetWorkOrders } from './get-work-orders-validator';

const references = {
  getAssetById: vi.fn(),
  getWorkOrderTypeById: vi.fn(),
  getWorkOrderStatusById: vi.fn(),
  getWorkOrderPriorityById: vi.fn(),
};
const payload = { assetId: 1, typeId: 2, priorityId: 3, statusId: 4 };

describe('WorkOrder validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    references.getAssetById.mockResolvedValue({ id: 1 });
    references.getWorkOrderTypeById.mockResolvedValue({ id: 2 });
    references.getWorkOrderPriorityById.mockResolvedValue({ id: 3 });
    references.getWorkOrderStatusById.mockResolvedValue({ id: 4 });
  });

  it('should return schema errors and skip reference checks when payload is invalid', async () => {
    const result = await validateCreateWorkOrder({}, 'tenant-1', references);
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Work order asset ID is required']),
    });
    expect(references.getAssetById).not.toHaveBeenCalled();
  });

  it('should flag invalid references with a conflict status', async () => {
    references.getAssetById.mockResolvedValue(undefined);
    references.getWorkOrderPriorityById.mockResolvedValue(undefined);
    const result = await validateCreateWorkOrder(payload, 'tenant-1', references);
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Asset 1 is Invalid.', 'Work order priority 3 is Invalid.'],
    });
  });

  it('should return parsed data when all references resolve', async () => {
    await expect(validateCreateWorkOrder(payload, 'tenant-1', references)).resolves.toMatchObject({
      success: true,
      data: { assetId: 1, typeId: 2, priorityId: 3, statusId: 4 },
    });
  });

  it('should validate the list tenant id', () => {
    expect(validateGetWorkOrders('tenant-1')).toEqual({ success: true, data: 'tenant-1' });
    expect(validateGetWorkOrders('   ')).toMatchObject({
      success: false,
      errors: ['Tenant ID cannot be empty'],
    });
  });
});
