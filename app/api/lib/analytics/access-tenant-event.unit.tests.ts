import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/api/lib/analytics/server-analytics', () => ({
  analyticsActorFromSession: vi.fn(() => ({ userId: 'user_1', tenantId: 'tenant_1' })),
  identifyServerTenantGroup: vi.fn(),
  recordServerEvent: vi.fn(),
}));

import {
  analyticsActorFromSession,
  identifyServerTenantGroup,
  recordServerEvent,
} from '@/app/api/lib/analytics/server-analytics';
import type { Tenant } from '@/app/api/lib/modules/tenant/schemas/tenant-schema';
import type { Session } from '@/app/lib/auth';

import {
  identifyTenantGroup,
  minutesSinceSignup,
  recordTenantChanged,
} from './access-tenant-event';

const tenant: Tenant = {
  id: 'tenant_1',
  name: 'Apollo Hospitals',
  slug: 'apollo',
  createdAt: new Date('2026-11-21T10:00:00.000Z'),
  isActive: true,
  logo: 'https://example.com/logo.png',
  timeZone: 'Asia/Dubai',
  isOnboarded: true,
};

describe('access Tenant events', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should set the Tenant group from its display details only', () => {
    identifyTenantGroup(tenant);

    expect(identifyServerTenantGroup).toHaveBeenCalledWith('tenant_1', {
      name: 'Apollo Hospitals',
      slug: 'apollo',
      time_zone: 'Asia/Dubai',
      is_active: true,
      created_at: '2026-11-21T10:00:00.000Z',
    });
  });

  it('should count whole minutes since signup and never go negative', () => {
    expect(minutesSinceSignup(tenant, new Date('2026-11-21T10:42:59.000Z'))).toBe(42);
    expect(minutesSinceSignup(tenant, new Date('2026-11-21T09:00:00.000Z'))).toBe(0);
  });

  it('should attach a Tenant change to the changed Tenant and refresh its group', () => {
    const session = { user: { id: 'user_1' } } as Session;
    const request = new Request('http://localhost/api/v1/tenants/tenant_1/deactivate');

    recordTenantChanged(session, request, { ...tenant, isActive: false }, 'tenant_deactivated');

    expect(analyticsActorFromSession).toHaveBeenCalledWith(
      { session, tenantId: 'tenant_1' },
      request
    );
    expect(recordServerEvent).toHaveBeenCalledWith(
      { userId: 'user_1', tenantId: 'tenant_1' },
      'tenant_deactivated',
      {}
    );
    expect(identifyServerTenantGroup).toHaveBeenCalledWith(
      'tenant_1',
      expect.objectContaining({ is_active: false })
    );
  });
});
