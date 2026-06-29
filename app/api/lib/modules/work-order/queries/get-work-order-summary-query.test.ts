import assert from 'node:assert/strict';

import { getWorkOrderSummaryQuery } from './get-work-order-summary-query';

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void | Promise<void>): void;

describe('Get Work Order summary query', () => {
  test('returns all four repository counts for a valid Tenant', async () => {
    const summary = {
      activeCount: 8,
      overdueCount: 2,
      dueNext7DaysCount: 3,
      completedLast30dCount: 5,
    };

    const result = await getWorkOrderSummaryQuery('tenant-a', {
      getWorkOrderSummary: async (tenantId) => {
        assert.equal(tenantId, 'tenant-a');
        return summary;
      },
    });

    assert.deepEqual(result, { success: true, data: summary });
  });

  test('rejects an empty Tenant ID without reading the repository', async () => {
    let repositoryCalled = false;

    const result = await getWorkOrderSummaryQuery('   ', {
      getWorkOrderSummary: async () => {
        repositoryCalled = true;
        throw new Error('Repository should not be called');
      },
    });

    assert.equal(repositoryCalled, false);
    assert.deepEqual(result, { success: false, errors: ['Tenant ID cannot be empty'] });
  });
});
