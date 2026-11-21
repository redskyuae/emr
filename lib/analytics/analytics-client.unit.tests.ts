// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const posthog = vi.hoisted(() => ({
  init: vi.fn(),
  register: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  group: vi.fn(),
  reset: vi.fn(),
  set_config: vi.fn(),
  config: { persistence: 'memory' },
}));

vi.mock('posthog-js', () => ({ default: posthog }));
vi.mock('posthog-js/dist/tracing-headers', () => ({}));

const settings = { projectKey: 'phc_test', apiHost: '/relay', uiHost: 'https://eu.posthog.com' };

const currentUser = (tenantId: string) => ({
  user: { id: 'user-1', staffProfile: null },
  tenant: {
    id: tenantId,
    name: 'Apollo',
    slug: `slug-${tenantId}`,
    isActive: true,
    timeZone: 'Asia/Dubai',
  },
  roles: [{ code: 'DOCTOR' }],
  membership: { role: 'member' },
});

async function loadClient() {
  vi.resetModules();
  return import('./analytics-client');
}

/** Lets the lazy `import('posthog-js')` resolve and the queue drain. */
async function flushLoad() {
  await vi.waitFor(() => expect(posthog.init).toHaveBeenCalled());
}

function goTo(path: string) {
  window.history.replaceState(null, '', path);
}

describe('analytics client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    goTo('/dashboard');
  });

  afterEach(() => {
    goTo('/');
  });

  it('should keep the page an event was recorded on when it is sent after loading', async () => {
    const client = await loadClient();

    client.startAnalytics({
      settings,
      brandVariant: 'none',
      sidebarMode: 'full',
      signedIn: false,
    });
    goTo('/patients/123');
    client.captureAnalyticsEvent('$pageview', { is_demo_page: false });
    goTo('/appointments');
    await flushLoad();

    const pageview = posthog.capture.mock.calls.find(([event]) => event === '$pageview');
    expect(pageview?.[1]).toMatchObject({ route: '/patients/:id', is_demo_page: false });
  });

  it('should keep sign-out and reset when the queue is full of events', async () => {
    const client = await loadClient();

    client.startAnalytics({
      settings,
      brandVariant: 'none',
      sidebarMode: 'full',
      signedIn: false,
    });
    client.identifyAnalyticsUser(currentUser('tenant-1'));
    for (let index = 0; index < 150; index += 1) {
      client.captureAnalyticsEvent('$pageleave', {});
    }
    client.resetAnalyticsUser('user');
    await flushLoad();

    const order = [
      ...posthog.identify.mock.invocationCallOrder.map((at) => ({ at, call: 'identify' })),
      ...posthog.reset.mock.invocationCallOrder.map((at) => ({ at, call: 'reset' })),
      ...posthog.capture.mock.calls
        .map(([event], index) => ({ event, at: posthog.capture.mock.invocationCallOrder[index] }))
        .filter(({ event }) => event === 'signed_out')
        .map(({ at }) => ({ at, call: 'signed_out' })),
    ]
      .sort((a, b) => a.at - b.at)
      .map(({ call }) => call);

    expect(order).toEqual(['identify', 'signed_out', 'reset']);
  });

  it('should identify again when the same user moves to another Tenant', async () => {
    const client = await loadClient();

    client.startAnalytics({
      settings,
      brandVariant: 'none',
      sidebarMode: 'full',
      signedIn: true,
    });
    await flushLoad();
    client.identifyAnalyticsUser(currentUser('tenant-1'));
    client.identifyAnalyticsUser(currentUser('tenant-1'));
    client.identifyAnalyticsUser(currentUser('tenant-2'));

    expect(posthog.identify).toHaveBeenCalledTimes(2);
    expect(posthog.group).toHaveBeenLastCalledWith('tenant', 'tenant-2', expect.anything());
    expect(posthog.register).toHaveBeenLastCalledWith({
      tenant_id: 'tenant-2',
      tenant_slug: 'slug-tenant-2',
    });
  });

  it('should not store the raw referrer or first address, and clean the address PostHog reads', async () => {
    const client = await loadClient();

    client.startAnalytics({
      settings,
      brandVariant: 'none',
      sidebarMode: 'full',
      signedIn: false,
    });
    await flushLoad();

    const [, config] = posthog.init.mock.calls[0];
    expect(config).toMatchObject({ save_referrer: false, save_campaign_params: false });
    expect(config.get_current_url('https://emr.example.com/patients/42?q=Asha')).toBe(
      'https://emr.example.com/patients/:id'
    );
  });
});
