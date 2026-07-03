import { beforeEach, describe, expect, it, vi } from 'vitest';

import { workOrderRepository } from '../repository/work-order-repository';
import { getWorkOrdersQuery } from './get-work-orders-query';

vi.mock('../repository/work-order-repository', () => ({
  workOrderRepository: { getWorkOrders: vi.fn() },
}));

const repo = vi.mocked(workOrderRepository);
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

describe('WorkOrder queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getWorkOrders.mockResolvedValue({ data: [workOrder], total: 1 });
  });

  it('should return validation failure and not call repository when tenant is invalid', async () => {
    const result = await getWorkOrdersQuery({ tenantId: '   ' });
    expect(result).toMatchObject({ success: false });
    expect(repo.getWorkOrders).not.toHaveBeenCalled();
  });

  it('should return list data and pass filters through on success', async () => {
    const result = await getWorkOrdersQuery({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'wo',
      typeId: 2,
      priorityId: 3,
      statusId: 4,
      assetId: 1,
    });
    expect(result).toEqual({ success: true, data: [workOrder], total: 1 });
    expect(repo.getWorkOrders).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'wo',
      typeId: 2,
      priorityId: 3,
      statusId: 4,
      assetId: 1,
    });
  });
});
