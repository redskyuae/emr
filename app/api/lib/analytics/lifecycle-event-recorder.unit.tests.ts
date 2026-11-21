import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./server-analytics', () => ({
  recordServerEvent: vi.fn(),
  analyticsActorFromSession: vi.fn(),
}));

import type { TenantSession } from '@/app/api/lib/utils/auth-helpers';
import { recordLifecycleEvent } from './lifecycle-event-recorder';
import { analyticsActorFromSession, recordServerEvent } from './server-analytics';

const tenantSession = {
  tenantId: 'tenant-1',
  session: { user: { id: 'user-1' }, session: {} },
} as unknown as TenantSession;
const request = new Request('http://localhost/api/v1/admissions/3/cancel', { method: 'POST' });
const actor = { userId: 'user-1', tenantId: 'tenant-1', isImpersonated: false, sessionId: null };

describe('recordLifecycleEvent', () => {
  beforeEach(() => {
    vi.mocked(recordServerEvent).mockReset();
    vi.mocked(analyticsActorFromSession).mockReset().mockReturnValue(actor);
  });

  it('should record the event for the acting user with the built properties', () => {
    recordLifecycleEvent(tenantSession, request, 'bed_transferred', () => ({ same_ward: true }));

    expect(analyticsActorFromSession).toHaveBeenCalledWith(tenantSession, request);
    expect(recordServerEvent).toHaveBeenCalledWith(actor, 'bed_transferred', { same_ward: true });
  });

  it('should record nothing and not throw when the properties cannot be built', () => {
    expect(() =>
      recordLifecycleEvent(tenantSession, request, 'bed_transferred', () => {
        throw new TypeError('unexpected record shape');
      })
    ).not.toThrow();
    expect(recordServerEvent).not.toHaveBeenCalled();
  });

  it('should not throw when recording itself fails', () => {
    vi.mocked(recordServerEvent).mockImplementation(() => {
      throw new Error('PostHog misconfigured');
    });

    expect(() =>
      recordLifecycleEvent(tenantSession, request, 'admission_cancelled', () => ({}))
    ).not.toThrow();
  });
});
