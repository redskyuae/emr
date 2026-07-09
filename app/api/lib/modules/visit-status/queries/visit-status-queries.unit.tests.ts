import { beforeEach, describe, expect, it, vi } from 'vitest';

import { visitStatusRepository } from '../repository/visit-status-repository';
import { validateGetVisitStatusById } from '../validator/get-visit-status-by-id-validator';
import { validateGetVisitStatuses } from '../validator/get-visit-statuses-validator';
import { getVisitStatusByIdQuery } from './get-visit-status-by-id-query';
import { getVisitStatusesQuery } from './get-visit-statuses-query';

vi.mock('../repository/visit-status-repository', () => ({
  visitStatusRepository: {
    getVisitStatusById: vi.fn(),
    getVisitStatuses: vi.fn(),
  },
}));
vi.mock('../validator/get-visit-status-by-id-validator', () => ({
  validateGetVisitStatusById: vi.fn(),
}));
vi.mock('../validator/get-visit-statuses-validator', () => ({
  validateGetVisitStatuses: vi.fn(),
}));

const repo = vi.mocked(visitStatusRepository);
const validateById = vi.mocked(validateGetVisitStatusById);
const validateList = vi.mocked(validateGetVisitStatuses);
const status = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Waiting',
  code: 'WAIT',
  color: '#16A34A',
  category: 'WAITING' as const,
  isSystem: false,
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('VisitStatus queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getVisitStatusById.mockResolvedValue(status);
    repo.getVisitStatuses.mockResolvedValue({ data: [status], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getVisitStatusByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getVisitStatusById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getVisitStatusByIdQuery('1', 'tenant-1');
    expect(repo.getVisitStatusById).toHaveBeenCalledWith(1, 'tenant-1');
    await getVisitStatusesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'wait' });
    expect(repo.getVisitStatuses).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'wait',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getVisitStatusesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [status],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getVisitStatusByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: status,
    });
  });

  it('should return not found when get-by-id repository returns nothing', async () => {
    repo.getVisitStatusById.mockResolvedValue(undefined);
    const result = await getVisitStatusByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });

  it('should not call list repository when tenant validation fails', async () => {
    validateList.mockReturnValue({ success: false, errors: ['Tenant ID cannot be empty'] });
    const result = await getVisitStatusesQuery({ tenantId: '  ' });
    expect(result).toEqual({ success: false, errors: ['Tenant ID cannot be empty'] });
    expect(repo.getVisitStatuses).not.toHaveBeenCalled();
  });
});
