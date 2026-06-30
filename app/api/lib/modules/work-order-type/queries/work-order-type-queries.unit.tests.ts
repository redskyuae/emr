import { beforeEach, describe, expect, it, vi } from 'vitest';

import { workOrderTypeRepository } from '../repository/work-order-type-repository';
import { validateGetWorkOrderTypeById } from '../validator/get-work-order-type-by-id-validator';
import { validateGetWorkOrderTypes } from '../validator/get-work-order-types-validator';
import { getWorkOrderTypeByIdQuery } from './get-work-order-type-by-id-query';
import { getWorkOrderTypesQuery } from './get-work-order-types-query';

vi.mock('../repository/work-order-type-repository', () => ({
  workOrderTypeRepository: {
    getWorkOrderTypeById: vi.fn(),
    getWorkOrderTypes: vi.fn(),
  },
}));
vi.mock('../validator/get-work-order-type-by-id-validator', () => ({
  validateGetWorkOrderTypeById: vi.fn(),
}));
vi.mock('../validator/get-work-order-types-validator', () => ({
  validateGetWorkOrderTypes: vi.fn(),
}));

const repo = vi.mocked(workOrderTypeRepository);
const validateById = vi.mocked(validateGetWorkOrderTypeById);
const validateList = vi.mocked(validateGetWorkOrderTypes);
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

describe('WorkOrderType queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getWorkOrderTypeById.mockResolvedValue(condition);
    repo.getWorkOrderTypes.mockResolvedValue({ data: [condition], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getWorkOrderTypeByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getWorkOrderTypeById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getWorkOrderTypeByIdQuery('1', 'tenant-1');
    expect(repo.getWorkOrderTypeById).toHaveBeenCalledWith(1, 'tenant-1');
    await getWorkOrderTypesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'go' });
    expect(repo.getWorkOrderTypes).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'go',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getWorkOrderTypesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [condition],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getWorkOrderTypeByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: condition,
    });
  });

  it('should return not found when get-by-id repository returns nothing', async () => {
    repo.getWorkOrderTypeById.mockResolvedValue(undefined);
    const result = await getWorkOrderTypeByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });

  it('should not call list repository when tenant validation fails', async () => {
    validateList.mockReturnValue({ success: false, errors: ['Tenant ID cannot be empty'] });
    const result = await getWorkOrderTypesQuery({ tenantId: '  ' });
    expect(result).toEqual({ success: false, errors: ['Tenant ID cannot be empty'] });
    expect(repo.getWorkOrderTypes).not.toHaveBeenCalled();
  });
});
