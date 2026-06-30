import { beforeEach, describe, expect, it, vi } from 'vitest';

import { workOrderStatusRepository } from '../repository/work-order-status-repository';
import { validateGetWorkOrderStatusById } from '../validator/get-work-order-status-by-id-validator';
import { validateGetWorkOrderStatuses } from '../validator/get-work-order-statuses-validator';
import { getWorkOrderStatusByIdQuery } from './get-work-order-status-by-id-query';
import { getWorkOrderStatusesQuery } from './get-work-order-statuses-query';

vi.mock('../repository/work-order-status-repository', () => ({
  workOrderStatusRepository: {
    getWorkOrderStatusById: vi.fn(),
    getWorkOrderStatuses: vi.fn(),
  },
}));
vi.mock('../validator/get-work-order-status-by-id-validator', () => ({
  validateGetWorkOrderStatusById: vi.fn(),
}));
vi.mock('../validator/get-work-order-statuses-validator', () => ({
  validateGetWorkOrderStatuses: vi.fn(),
}));

const repo = vi.mocked(workOrderStatusRepository);
const validateById = vi.mocked(validateGetWorkOrderStatusById);
const validateList = vi.mocked(validateGetWorkOrderStatuses);
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

describe('WorkOrderStatus queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getWorkOrderStatusById.mockResolvedValue(status);
    repo.getWorkOrderStatuses.mockResolvedValue({ data: [status], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'], status: 422 });
    await expect(getWorkOrderStatusByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getWorkOrderStatusById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getWorkOrderStatusByIdQuery('1', 'tenant-1');
    expect(repo.getWorkOrderStatusById).toHaveBeenCalledWith(1, 'tenant-1');
    await getWorkOrderStatusesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'op' });
    expect(repo.getWorkOrderStatuses).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'op',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getWorkOrderStatusesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [status],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getWorkOrderStatusByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: status,
    });
  });

  it('should return not found when get-by-id repository returns nothing', async () => {
    repo.getWorkOrderStatusById.mockResolvedValue(undefined);
    const result = await getWorkOrderStatusByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });

  it('should not call list repository when tenant validation fails', async () => {
    validateList.mockReturnValue({ success: false, errors: ['Tenant ID cannot be empty'] });
    const result = await getWorkOrderStatusesQuery({ tenantId: '  ' });
    expect(result).toEqual({ success: false, errors: ['Tenant ID cannot be empty'] });
    expect(repo.getWorkOrderStatuses).not.toHaveBeenCalled();
  });
});
