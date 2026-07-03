import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getWorkOrderSummaryQuery } from './get-work-order-summary-query';

const summary = {
  activeCount: 7,
  overdueCount: 2,
  dueNext7DaysCount: 4,
  completedLast30dCount: 11,
};

describe('GetWorkOrderSummary query', () => {
  const getWorkOrderSummary = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getWorkOrderSummary.mockResolvedValue(summary);
  });

  it('should normalize the tenant id before calling the repository', async () => {
    const result = await getWorkOrderSummaryQuery('  tenant-a  ', { getWorkOrderSummary });
    expect(getWorkOrderSummary).toHaveBeenCalledWith('tenant-a');
    expect(result).toEqual({ success: true, data: summary });
  });

  it('should reject an empty tenant id without reading the repository', async () => {
    const result = await getWorkOrderSummaryQuery('   ', { getWorkOrderSummary });
    expect(result).toEqual({ success: false, errors: ['Tenant ID cannot be empty'] });
    expect(getWorkOrderSummary).not.toHaveBeenCalled();
  });
});
