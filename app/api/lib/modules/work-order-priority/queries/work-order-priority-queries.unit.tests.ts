import { beforeEach, describe, expect, it, vi } from 'vitest';

import { workOrderPriorityRepository } from '../repository/work-order-priority-repository';
import { validateGetWorkOrderPriorityById } from '../validator/get-work-order-priority-by-id-validator';
import { validateGetWorkOrderPriorities } from '../validator/get-work-order-priorities-validator';
import { getWorkOrderPriorityByIdQuery } from './get-work-order-priority-by-id-query';
import { getWorkOrderPrioritiesQuery } from './get-work-order-priorities-query';

vi.mock('../repository/work-order-priority-repository', () => ({
  workOrderPriorityRepository: {
    getWorkOrderPriorityById: vi.fn(),
    getWorkOrderPriorities: vi.fn(),
  },
}));
vi.mock('../validator/get-work-order-priority-by-id-validator', () => ({
  validateGetWorkOrderPriorityById: vi.fn(),
}));
vi.mock('../validator/get-work-order-priorities-validator', () => ({
  validateGetWorkOrderPriorities: vi.fn(),
}));

const repo = vi.mocked(workOrderPriorityRepository);
const validateById = vi.mocked(validateGetWorkOrderPriorityById);
const validateList = vi.mocked(validateGetWorkOrderPriorities);
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

describe('WorkOrderPriority queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getWorkOrderPriorityById.mockResolvedValue(condition);
    repo.getWorkOrderPriorities.mockResolvedValue({ data: [condition], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'], status: 422 });
    await expect(getWorkOrderPriorityByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getWorkOrderPriorityById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getWorkOrderPriorityByIdQuery('1', 'tenant-1');
    expect(repo.getWorkOrderPriorityById).toHaveBeenCalledWith(1, 'tenant-1');
    await getWorkOrderPrioritiesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'go' });
    expect(repo.getWorkOrderPriorities).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'go',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getWorkOrderPrioritiesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [condition],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getWorkOrderPriorityByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: condition,
    });
  });

  it('should return not found when get-by-id repository returns nothing', async () => {
    repo.getWorkOrderPriorityById.mockResolvedValue(undefined);
    const result = await getWorkOrderPriorityByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });

  it('should not call list repository when tenant validation fails', async () => {
    validateList.mockReturnValue({ success: false, errors: ['Tenant ID cannot be empty'] });
    const result = await getWorkOrderPrioritiesQuery({ tenantId: '  ' });
    expect(result).toEqual({ success: false, errors: ['Tenant ID cannot be empty'] });
    expect(repo.getWorkOrderPriorities).not.toHaveBeenCalled();
  });
});
