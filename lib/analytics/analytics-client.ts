// The browser side of analytics. Every client Analytics Event goes through `captureAnalyticsEvent`,
// which only accepts catalogue events with their declared properties. PostHog itself is loaded
// lazily, only when the deployment switch is on; until it has loaded, calls are queued, and with
// analytics off every call is a no-op. Nothing here may throw into the caller or delay it.

import type { CaptureResult, PostHog, PostHogConfig } from 'posthog-js';

import type { ClientAnalyticsSettings } from '@/lib/analytics/analytics-settings';
import { guardCapture } from '@/lib/analytics/capture-guard';
import {
  sanitizeEventProperties,
  TENANT_GROUP_TYPE,
  type AnalyticsEventProperties,
  type ClientEventName,
  type SidebarMode,
} from '@/lib/analytics/catalogue';
import type { SignOutTrigger } from '@/lib/analytics/events/foundation-events';
import { buildAnalyticsIdentity, type IdentitySource } from '@/lib/analytics/identity';
import { buildPageContext } from '@/lib/analytics/page-context';

type StartOptions = {
  settings: ClientAnalyticsSettings;
  brandVariant: string;
  sidebarMode: SidebarMode;
  /**
   * Whether this tab already holds a signed-in Session. Before sign-in PostHog keeps everything in
   * memory, so nothing is stored in the visitor's browser.
   */
  signedIn: boolean;
};

type Call = (posthog: PostHog) => void;

const MAX_QUEUED_CALLS = 100;

let posthogClient: PostHog | null = null;
/** `null` until analytics starts; calls made while PostHog is loading wait here. */
let queuedCalls: Call[] | null = null;
let baseProperties: Record<string, string> = {};
let identifiedUserId: string | null = null;

function safely(call: () => void) {
  try {
    call();
  } catch {
    // Analytics must never get in the way of the EMR.
  }
}

function run(call: Call) {
  safely(() => {
    if (posthogClient) {
      const client = posthogClient;
      call(client);
    } else if (queuedCalls && queuedCalls.length < MAX_QUEUED_CALLS) {
      queuedCalls.push(call);
    }
  });
}

function beforeSend(capture: CaptureResult | null): CaptureResult | null {
  if (!capture) {
    return null;
  }

  try {
    return guardCapture(capture, buildPageContext(window.location.pathname));
  } catch {
    return null;
  }
}

function buildConfig({ settings, signedIn }: StartOptions): Partial<PostHogConfig> {
  return {
    api_host: settings.apiHost,
    ui_host: settings.uiHost,
    person_profiles: 'identified_only',
    persistence: signedIn ? 'localStorage' : 'memory',
    // Page views go through `captureAnalyticsEvent` so they carry the cleaned route, and so a
    // `nuqs` query-string change (a sheet opening, a filter) is not a page view.
    capture_pageview: false,
    capture_pageleave: true,
    // These copy on-screen text, record the screen or send addresses that carry record ids.
    autocapture: false,
    rageclick: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_exceptions: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_product_tours: true,
    disable_conversations: true,
    disable_web_experiments: true,
    // No script is fetched at run time; the one extension used (tracing headers) is bundled below.
    disable_external_dependency_loading: true,
    advanced_disable_flags: true,
    // `?__posthog_debug=true` would otherwise switch debug logging on and store a flag in
    // localStorage before sign-in.
    debug: false,
    save_campaign_params: false,
    mask_personal_data_properties: true,
    // Adds PostHog's session and person ids as headers on same-origin API calls, so the server's
    // outcome events join the browser session that caused them.
    tracing_headers: [window.location.hostname],
    before_send: beforeSend,
  };
}

export function startAnalytics(options: StartOptions) {
  if (typeof window === 'undefined' || queuedCalls || posthogClient) {
    return;
  }

  queuedCalls = [];
  baseProperties = {
    source: 'client',
    brand_variant: options.brandVariant,
    sidebar_mode: options.sidebarMode,
  };

  // The tracing-headers extension registers itself on `window` when loaded, so PostHog uses it
  // instead of fetching the script from its asset host.
  Promise.all([import('posthog-js'), import('posthog-js/dist/tracing-headers')])
    .then(([{ default: posthog }]) => {
      posthog.init(options.settings.projectKey, buildConfig(options));
      posthog.register(baseProperties);
      posthogClient = posthog;

      const calls = queuedCalls ?? [];
      queuedCalls = [];
      calls.forEach((call) => safely(() => call(posthog)));
    })
    .catch(() => {
      // Blocked or failed to load: drop everything from here on.
      queuedCalls = null;
    });
}

export function captureAnalyticsEvent<E extends ClientEventName>(
  event: E,
  properties: AnalyticsEventProperties<E>
) {
  run((posthog) => {
    const sanitized = sanitizeEventProperties(event, properties);

    if (sanitized) {
      posthog.capture(event, sanitized);
    }
  });
}

/** Identifies the browser as the Current User and attaches it to their Tenant. */
export function identifyAnalyticsUser(source: IdentitySource) {
  const identity = buildAnalyticsIdentity(source);

  if (identifiedUserId === identity.distinctId) {
    return;
  }

  identifiedUserId = identity.distinctId;

  run((posthog) => {
    if (posthog.config.persistence === 'memory') {
      posthog.set_config({ persistence: 'localStorage' });
    }

    posthog.identify(identity.distinctId, identity.person);
    posthog.group(TENANT_GROUP_TYPE, identity.tenant.id, identity.tenant.properties);
    posthog.register({ tenant_id: identity.tenant.id, tenant_slug: identity.tenant.slug });
  });
}

/**
 * Records `signed_out`, then makes the browser anonymous again and clears what PostHog stored, so
 * the next sign-in on this browser, as anyone, is a new person.
 */
export function resetAnalyticsUser(trigger: SignOutTrigger) {
  captureAnalyticsEvent('signed_out', { trigger });
  identifiedUserId = null;

  run((posthog) => {
    posthog.reset();
    posthog.set_config({ persistence: 'memory' });
    posthog.register(baseProperties);
  });
}
