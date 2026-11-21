import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/api/lib/analytics/server-analytics', () => ({
  analyticsActorFromSession: vi.fn(() => ({ userId: 'user_1', tenantId: 'tenant_1' })),
  recordServerEvent: vi.fn(),
}));

import {
  analyticsActorFromSession,
  recordServerEvent,
} from '@/app/api/lib/analytics/server-analytics';
import type { Session } from '@/app/lib/auth';

import { recordOwnSessionsRevoked } from './access-session-event';

const request = new Request('http://localhost/api/v1/sessions');

function sessionWithTenant(activeOrganizationId: string | null) {
  return { user: { id: 'user_1' }, session: { activeOrganizationId } } as unknown as Session;
}

describe('recordOwnSessionsRevoked', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should record the scope for the Active Tenant', () => {
    const session = sessionWithTenant('tenant_1');

    recordOwnSessionsRevoked(session, request, 'all');

    expect(analyticsActorFromSession).toHaveBeenCalledWith(
      { session, tenantId: 'tenant_1' },
      request
    );
    expect(recordServerEvent).toHaveBeenCalledWith(
      { userId: 'user_1', tenantId: 'tenant_1' },
      'sessions_revoked',
      { scope: 'all' }
    );
  });

  it('should record nothing for a Session without an Active Tenant', () => {
    recordOwnSessionsRevoked(sessionWithTenant(null), request, 'single');

    expect(recordServerEvent).not.toHaveBeenCalled();
  });
});
