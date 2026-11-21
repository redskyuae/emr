import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/api/lib/analytics/server-analytics', () => ({
  analyticsActorFromSession: vi.fn(() => ({ userId: 'user_1', tenantId: 'tenant_1' })),
  recordServerEventAfterLookup: vi.fn(),
}));

vi.mock('@/app/api/lib/modules/work-order-type/queries/get-work-order-type-by-id-query', () => ({
  getWorkOrderTypeByIdQuery: vi.fn(),
}));

vi.mock(
  '@/app/api/lib/modules/work-order-priority/queries/get-work-order-priority-by-id-query',
  () => ({ getWorkOrderPriorityByIdQuery: vi.fn() })
);

import { recordServerEventAfterLookup } from '@/app/api/lib/analytics/server-analytics';
import { getWorkOrderPriorityByIdQuery } from '@/app/api/lib/modules/work-order-priority/queries/get-work-order-priority-by-id-query';
import { getWorkOrderTypeByIdQuery } from '@/app/api/lib/modules/work-order-type/queries/get-work-order-type-by-id-query';
import type { TenantSession } from '@/app/api/lib/utils/auth-helpers';

import { recordWorkOrderCreated } from './access-work-order-event';

const tenantSession = { tenantId: 'tenant_1' } as TenantSession;
const request = new Request('http://localhost/api/v1/work-orders');

function lastLookup() {
  const [[, event, lookup]] = vi.mocked(recordServerEventAfterLookup).mock.calls;
  return { event, lookup };
}

describe('recordWorkOrderCreated', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should send the Work Order type and priority codes read after the response', async () => {
    vi.mocked(getWorkOrderTypeByIdQuery).mockResolvedValue({
      success: true,
      data: { code: 'PREV' },
    } as never);
    vi.mocked(getWorkOrderPriorityByIdQuery).mockResolvedValue({
      success: true,
      data: { code: 'HIGH' },
    } as never);

    recordWorkOrderCreated(tenantSession, request, { typeId: 4, priorityId: 7 });
    const { event, lookup } = lastLookup();

    expect(getWorkOrderTypeByIdQuery).not.toHaveBeenCalled();
    expect(event).toBe('work_order_created');
    await expect(lookup()).resolves.toEqual({
      work_order_type_code: 'PREV',
      work_order_priority_code: 'HIGH',
    });
    expect(getWorkOrderTypeByIdQuery).toHaveBeenCalledWith(4, 'tenant_1');
    expect(getWorkOrderPriorityByIdQuery).toHaveBeenCalledWith(7, 'tenant_1');
  });

  it('should still record the Work Order when a Master can no longer be read', async () => {
    vi.mocked(getWorkOrderTypeByIdQuery).mockResolvedValue({
      success: false,
      errors: ['Work order type not found'],
    } as never);
    vi.mocked(getWorkOrderPriorityByIdQuery).mockResolvedValue({
      success: true,
      data: { code: 'LOW' },
    } as never);

    recordWorkOrderCreated(tenantSession, request, { typeId: 4, priorityId: 7 });

    await expect(lastLookup().lookup()).resolves.toEqual({
      work_order_type_code: null,
      work_order_priority_code: 'LOW',
    });
  });
});
