import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const posthogMocks = vi.hoisted(() => ({
  captureImmediate: vi.fn(),
  groupIdentify: vi.fn(),
  flush: vi.fn(),
  constructed: vi.fn(),
}));

const afterCallbacks = vi.hoisted(() => [] as (() => Promise<void>)[]);

vi.mock('posthog-node', () => ({
  PostHog: class {
    constructor(key: string, options: unknown) {
      posthogMocks.constructed(key, options);
    }
    captureImmediate = posthogMocks.captureImmediate;
    groupIdentify = posthogMocks.groupIdentify;
    flush = posthogMocks.flush;
  },
}));

vi.mock('next/server', () => ({
  after: (callback: () => Promise<void>) => {
    afterCallbacks.push(callback);
  },
}));

vi.mock('@/app/api/lib/modules/tenant/repository/tenant-repository', () => ({
  tenantRepository: { getTenantById: vi.fn() },
}));

vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ getSession: vi.fn() }));

import { tenantRepository } from '@/app/api/lib/modules/tenant/repository/tenant-repository';
import { getSession, type TenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { Session } from '@/app/lib/auth';

import {
  analyticsActorFromSession,
  identifyServerTenantGroup,
  recordServerEvent,
  recordServerEventAfterLookup,
  recordServerEventForCurrentSession,
} from './server-analytics';

async function runAfterCallbacks() {
  const callbacks = afterCallbacks.splice(0);
  await Promise.all(callbacks.map((callback) => callback()));
}

const actor = { userId: 'user_1', tenantId: 'tenant_1' };

describe('server analytics', () => {
  beforeEach(() => {
    vi.stubEnv('ANALYTICS_ENABLED', 'true');
    vi.stubEnv('POSTHOG_PROJECT_KEY', 'phc_test');
    vi.mocked(tenantRepository.getTenantById).mockResolvedValue({
      id: 'tenant_1',
      name: 'Apollo Hospitals',
      slug: 'apollo',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      isActive: true,
      logo: null,
      timeZone: 'Asia/Dubai',
      isOnboarded: true,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    afterCallbacks.length = 0;
  });

  it('should schedule nothing when the analytics switch is off', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'false');

    recordServerEvent(actor, 'user_signed_in', { remember_me: true });

    expect(afterCallbacks).toHaveLength(0);
    await runAfterCallbacks();
    expect(posthogMocks.captureImmediate).not.toHaveBeenCalled();
  });

  it('should send nothing until the response is done', () => {
    recordServerEvent(actor, 'user_signed_in', { remember_me: true });

    expect(afterCallbacks).toHaveLength(1);
    expect(posthogMocks.captureImmediate).not.toHaveBeenCalled();
  });

  it('should send the event for the acting user and Tenant with the common properties', async () => {
    recordServerEvent(
      { ...actor, sessionId: '01a1fd8a-59eb-7c62-991e-8de4cded2dc9' },
      'user_signed_in',
      {
        remember_me: true,
      }
    );
    await runAfterCallbacks();

    expect(posthogMocks.constructed).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({ host: 'https://eu.i.posthog.com', disableGeoip: true })
    );
    expect(posthogMocks.captureImmediate).toHaveBeenCalledWith({
      distinctId: 'user_1',
      event: 'user_signed_in',
      groups: { tenant: 'tenant_1' },
      disableGeoip: true,
      properties: {
        remember_me: true,
        source: 'server',
        tenant_id: 'tenant_1',
        tenant_slug: 'apollo',
        is_impersonated: false,
        $session_id: '01a1fd8a-59eb-7c62-991e-8de4cded2dc9',
      },
    });
  });

  it('should drop properties the catalogue does not declare', async () => {
    recordServerEvent(actor, 'user_signed_in', {
      remember_me: false,
      email: 'asha@example.com',
    } as never);
    await runAfterCallbacks();

    const [[message]] = posthogMocks.captureImmediate.mock.calls;
    expect(message.properties).not.toHaveProperty('email');
  });

  it('should drop a session id header that is not a plain id', async () => {
    recordServerEvent({ ...actor, sessionId: 'not an id; with spaces' }, 'user_signed_in', {
      remember_me: true,
    });
    await runAfterCallbacks();

    const [[message]] = posthogMocks.captureImmediate.mock.calls;
    expect(message.properties).not.toHaveProperty('$session_id');
  });

  it('should swallow a PostHog failure', async () => {
    posthogMocks.captureImmediate.mockRejectedValueOnce(new Error('PostHog is down'));

    recordServerEvent(actor, 'user_signed_in', { remember_me: true });

    await expect(runAfterCallbacks()).resolves.toBeUndefined();
  });

  it('should set only the declared Tenant group properties', async () => {
    identifyServerTenantGroup('tenant_1', {
      name: 'Apollo Hospitals',
      slug: 'apollo',
      owner_email: 'owner@example.com',
    } as never);
    await runAfterCallbacks();

    expect(posthogMocks.groupIdentify).toHaveBeenCalledWith({
      groupType: 'tenant',
      groupKey: 'tenant_1',
      properties: { name: 'Apollo Hospitals', slug: 'apollo' },
      disableGeoip: true,
    });
  });

  it('should record nothing for a session without a user, rather than throw', async () => {
    const tenantSession = { tenantId: 'tenant_1', session: {} } as unknown as TenantSession;

    expect(() =>
      recordServerEvent(analyticsActorFromSession(tenantSession), 'user_signed_in', {
        remember_me: true,
      })
    ).not.toThrow();
    await runAfterCallbacks();
    expect(posthogMocks.captureImmediate).not.toHaveBeenCalled();
  });

  it('should mark an impersonated Session and read the browser session header', () => {
    const tenantSession = {
      tenantId: 'tenant_1',
      session: { user: { id: 'user_1' }, session: { impersonatedBy: 'admin_1' } },
    } as unknown as TenantSession;
    const request = new Request('http://localhost/api/v1/visits', {
      headers: { 'x-posthog-session-id': 'session_1' },
    });

    expect(analyticsActorFromSession(tenantSession, request)).toEqual({
      userId: 'user_1',
      tenantId: 'tenant_1',
      isImpersonated: true,
      sessionId: 'session_1',
    });
  });

  it('should look properties up only after the response and send what the lookup returns', async () => {
    const lookup = vi.fn().mockResolvedValue({ role_count: 2 });

    recordServerEventAfterLookup(actor, 'staff_roles_changed', lookup);

    expect(lookup).not.toHaveBeenCalled();
    await runAfterCallbacks();

    expect(lookup).toHaveBeenCalledTimes(1);
    expect(posthogMocks.captureImmediate).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'staff_roles_changed',
        properties: expect.objectContaining({ role_count: 2, source: 'server' }),
      })
    );
  });

  it('should record nothing when the lookup returns null or fails', async () => {
    recordServerEventAfterLookup(actor, 'staff_roles_changed', async () => null);
    recordServerEventAfterLookup(actor, 'staff_roles_changed', async () => {
      throw new Error('Database is down');
    });

    await expect(runAfterCallbacks()).resolves.toBeUndefined();
    expect(posthogMocks.captureImmediate).not.toHaveBeenCalled();
  });

  it('should not look properties up when the analytics switch is off', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'false');
    const lookup = vi.fn().mockResolvedValue({ role_count: 2 });

    recordServerEventAfterLookup(actor, 'staff_roles_changed', lookup);
    await runAfterCallbacks();

    expect(lookup).not.toHaveBeenCalled();
  });

  it('should read the Session after the response and record for its Active Tenant', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: 'user_1' },
      session: { activeOrganizationId: 'tenant_1', impersonatedBy: null },
    } as unknown as Session);

    recordServerEventForCurrentSession(
      new Request('http://localhost/api/v1/countries'),
      'master_record_changed',
      { master: 'country', action: 'created' }
    );

    expect(getSession).not.toHaveBeenCalled();
    await runAfterCallbacks();

    expect(posthogMocks.captureImmediate).toHaveBeenCalledWith(
      expect.objectContaining({
        distinctId: 'user_1',
        event: 'master_record_changed',
        groups: { tenant: 'tenant_1' },
        properties: expect.objectContaining({ master: 'country', action: 'created' }),
      })
    );
  });

  it('should record nothing for a request without a Session or an Active Tenant', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { id: 'user_1' },
      session: { activeOrganizationId: null },
    } as unknown as Session);
    const request = new Request('http://localhost/api/v1/countries');

    recordServerEventForCurrentSession(request, 'master_record_changed', {
      master: 'country',
      action: 'created',
    });
    recordServerEventForCurrentSession(request, 'master_record_changed', {
      master: 'country',
      action: 'deleted',
    });
    await runAfterCallbacks();

    expect(getSession).toHaveBeenCalledTimes(2);
    expect(posthogMocks.captureImmediate).not.toHaveBeenCalled();
  });
});
