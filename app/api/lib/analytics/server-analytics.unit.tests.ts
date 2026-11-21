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

import { tenantRepository } from '@/app/api/lib/modules/tenant/repository/tenant-repository';
import type { TenantSession } from '@/app/api/lib/utils/auth-helpers';

import {
  analyticsActorFromSession,
  identifyServerTenantGroup,
  recordServerEvent,
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
});
