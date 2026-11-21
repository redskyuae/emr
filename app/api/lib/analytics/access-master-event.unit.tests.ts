import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/api/lib/analytics/server-analytics', () => ({
  analyticsActorFromSession: vi.fn(() => ({ userId: 'user_1', tenantId: 'tenant_1' })),
  recordServerEvent: vi.fn(),
  recordServerEventForCurrentSession: vi.fn(),
}));

import {
  analyticsActorFromSession,
  recordServerEvent,
  recordServerEventForCurrentSession,
} from '@/app/api/lib/analytics/server-analytics';
import type { TenantSession } from '@/app/api/lib/utils/auth-helpers';
import { CHARGE_ITEM_CATEGORIES } from '@/app/db/schema/charge-item';
import { analyticsEvents } from '@/lib/analytics/catalogue';

import { recordGlobalReferenceChanged, recordMasterRecordChanged } from './access-master-event';

const tenantSession = { tenantId: 'tenant_1' } as TenantSession;
const request = new Request('http://localhost/api/v1/wards');

describe('access master events', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should record the Master and the action for the acting user and Tenant', () => {
    recordMasterRecordChanged(tenantSession, request, { master: 'ward', action: 'created' });

    expect(analyticsActorFromSession).toHaveBeenCalledWith(tenantSession, request);
    expect(recordServerEvent).toHaveBeenCalledWith(
      { userId: 'user_1', tenantId: 'tenant_1' },
      'master_record_changed',
      { master: 'ward', action: 'created', charge_item_category: undefined }
    );
  });

  it('should send only the declared change, never a record name or code', () => {
    recordMasterRecordChanged(tenantSession, request, {
      master: 'charge-item',
      action: 'updated',
      charge_item_category: 'PROCEDURE',
      name: 'Abhyanga',
      code: 'AYU-001',
    } as never);

    expect(recordServerEvent).toHaveBeenCalledWith(expect.anything(), 'master_record_changed', {
      master: 'charge-item',
      action: 'updated',
      charge_item_category: 'PROCEDURE',
    });
  });

  it('should record a Global Reference change against the current Session', () => {
    recordGlobalReferenceChanged(request, {
      master: 'country',
      action: 'deleted',
      charge_item_category: 'BED',
    } as never);

    expect(recordServerEventForCurrentSession).toHaveBeenCalledWith(
      request,
      'master_record_changed',
      { master: 'country', action: 'deleted' }
    );
    expect(recordServerEvent).not.toHaveBeenCalled();
  });

  it('should declare every Charge Item Category the database allows', () => {
    const spec = analyticsEvents.master_record_changed.properties.charge_item_category;

    expect([...spec.values].sort()).toEqual([...CHARGE_ITEM_CATEGORIES].sort());
  });
});
