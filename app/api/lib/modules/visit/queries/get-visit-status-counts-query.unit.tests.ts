import { beforeEach, describe, expect, it, vi } from 'vitest';

import { visitRepository } from '../repository/visit-repository';
import { getVisitStatusCountsQuery } from './get-visit-status-counts-query';

vi.mock('../repository/visit-repository', () => ({
  visitRepository: { countVisitsByStatus: vi.fn() },
}));

const repo = vi.mocked(visitRepository);
const counts = { CHECKED_IN: 3, IN_CONSULTATION: 1, COMPLETED: 5, CANCELLED: 0 };

describe('getVisitStatusCountsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.countVisitsByStatus.mockResolvedValue(counts);
  });

  it('should not call the repository when validation fails', async () => {
    const result = await getVisitStatusCountsQuery({ tenantId: 'tenant-1', filters: {} });

    expect(result).toEqual({ success: false, errors: ['Visit date is required'] });
    expect(repo.countVisitsByStatus).not.toHaveBeenCalled();
  });

  it('should count with the validated day, Doctor and tenant', async () => {
    await getVisitStatusCountsQuery({
      tenantId: 'tenant-1',
      filters: { visitDate: '16-07-2026', doctorId: '2' },
    });

    expect(repo.countVisitsByStatus).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      visitDate: '2026-07-16',
      doctorId: 2,
    });
  });

  it('should return the counts as a single query result', async () => {
    await expect(
      getVisitStatusCountsQuery({ tenantId: 'tenant-1', filters: { visitDate: '16-07-2026' } })
    ).resolves.toEqual({ success: true, data: counts });
  });
});
