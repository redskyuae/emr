// The server side of analytics. A route handler records a business outcome from its success branch
// with `recordServerEvent`; commands stay free of analytics. The send is scheduled with Next's
// `after`, so it never delays or changes the response, and every failure is swallowed: a PostHog
// outage must not affect the EMR. With the deployment switch off nothing is scheduled at all.

import { after } from 'next/server';
import { PostHog } from 'posthog-node';

import { tenantRepository } from '@/app/api/lib/modules/tenant/repository/tenant-repository';
import { getSession, type TenantSession } from '@/app/api/lib/utils/auth-helpers';
import { getAnalyticsSettings, type AnalyticsSettings } from '@/lib/analytics/analytics-settings';
import {
  sanitizeEventProperties,
  TENANT_GROUP_TYPE,
  tenantGroupProperties,
  type AnalyticsEventProperties,
  type ServerEventName,
  type TenantGroupProperties,
} from '@/lib/analytics/catalogue';
import { coercePropertyValue, pickDeclaredProperties, prop } from '@/lib/analytics/event-spec';

/** Who did it: the acting user and their Active Tenant. No person properties are sent. */
export type AnalyticsActor = {
  userId: string;
  tenantId: string;
  isImpersonated?: boolean;
  /** PostHog's browser session id, so the outcome joins the browser session that caused it. */
  sessionId?: string | null;
};

/** Set on same-origin API calls by the browser SDK's tracing headers. Optional: API clients lack it. */
const SESSION_ID_HEADER = 'x-posthog-session-id';
const TENANT_SLUG_TTL_MS = 10 * 60 * 1000;

let client: { key: string; posthog: PostHog } | null = null;
const tenantSlugs = new Map<string, { slug: string; expiresAt: number }>();

function getClient(settings: AnalyticsSettings) {
  const key = `${settings.projectKey}@${settings.host}`;

  if (client?.key !== key) {
    client = {
      key,
      posthog: new PostHog(settings.projectKey, {
        host: settings.host,
        // Short-lived server instances: send each event at once rather than batching.
        flushAt: 1,
        flushInterval: 0,
        disableGeoip: true,
        fetchRetryCount: 1,
        requestTimeout: 3000,
      }),
    };
  }

  return client.posthog;
}

async function getTenantSlug(tenantId: string): Promise<string | undefined> {
  const cached = tenantSlugs.get(tenantId);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.slug;
  }

  const tenant = await tenantRepository.getTenantById(tenantId);

  if (tenant) {
    tenantSlugs.set(tenantId, { slug: tenant.slug, expiresAt: Date.now() + TENANT_SLUG_TTL_MS });
  }

  return tenant?.slug;
}

function schedule(work: (posthog: PostHog) => Promise<void>) {
  const settings = getAnalyticsSettings();

  if (!settings) {
    return;
  }

  try {
    after(async () => {
      try {
        await work(getClient(settings));
      } catch {
        // Analytics never gets in the way of the EMR.
      }
    });
  } catch {
    // `after` throws outside a request scope; there is nothing to record then.
  }
}

/** The actor of a tenant-scoped route. Pass the request so the browser session can be joined. */
export function analyticsActorFromSession(
  tenantSession: TenantSession,
  request?: Request
): AnalyticsActor {
  return {
    userId: tenantSession.session.user.id,
    tenantId: tenantSession.tenantId,
    isImpersonated: Boolean(tenantSession.session.session.impersonatedBy),
    sessionId: request?.headers.get(SESSION_ID_HEADER),
  };
}

/** Reads PostHog's session id header from a request, when it is a well-formed id. */
export function analyticsSessionIdFromRequest(request: Request): string | null {
  return request.headers.get(SESSION_ID_HEADER);
}

function sanitizeServerEvent<E extends ServerEventName>(
  actor: AnalyticsActor,
  event: E,
  properties: AnalyticsEventProperties<E>
) {
  return sanitizeEventProperties(event, {
    ...properties,
    source: 'server',
    tenant_id: actor.tenantId,
    is_impersonated: actor.isImpersonated ?? false,
  });
}

async function capture(
  posthog: PostHog,
  actor: AnalyticsActor,
  event: ServerEventName,
  sanitized: Record<string, unknown>
) {
  const sessionId = actor.sessionId ? coercePropertyValue(prop.code(), actor.sessionId) : undefined;
  const tenantSlug = await getTenantSlug(actor.tenantId);

  await posthog.captureImmediate({
    distinctId: actor.userId,
    event,
    groups: { [TENANT_GROUP_TYPE]: actor.tenantId },
    disableGeoip: true,
    properties: {
      ...sanitized,
      ...(tenantSlug ? { tenant_slug: tenantSlug } : {}),
      ...(sessionId ? { $session_id: sessionId } : {}),
    },
  });
}

/**
 * Records one server Analytics Event for the actor, after the response is sent. Call it only from
 * the success branch, once per outcome. Undeclared properties are dropped as in the browser.
 */
export function recordServerEvent<E extends ServerEventName>(
  actor: AnalyticsActor,
  event: E,
  properties: AnalyticsEventProperties<E>
) {
  const sanitized = sanitizeServerEvent(actor, event, properties);

  if (!sanitized) {
    return;
  }

  schedule((posthog) => capture(posthog, actor, event, sanitized));
}

/**
 * Like `recordServerEvent`, but the properties are read after the response is sent, for a property
 * that neither the payload nor the command result carries (a count after a removal, a Master code
 * behind an id). Return `null` to record nothing, for example when the read fails.
 */
export function recordServerEventAfterLookup<E extends ServerEventName>(
  actor: AnalyticsActor,
  event: E,
  lookupProperties: () => Promise<AnalyticsEventProperties<E> | null>
) {
  schedule(async (posthog) => {
    const properties = await lookupProperties();
    const sanitized = properties ? sanitizeServerEvent(actor, event, properties) : null;

    if (sanitized) {
      await capture(posthog, actor, event, sanitized);
    }
  });
}

/**
 * For a route that resolves no Session (the Global References): reads the Session after the response
 * is sent and records the event only when it has an Active Tenant. It adds no authorization.
 */
export function recordServerEventForCurrentSession<E extends ServerEventName>(
  request: Request,
  event: E,
  properties: AnalyticsEventProperties<E>
) {
  schedule(async (posthog) => {
    const session = await getSession();
    const tenantId = session?.session.activeOrganizationId;

    if (!session || !tenantId) {
      return;
    }

    const actor = analyticsActorFromSession({ session, tenantId }, request);
    const sanitized = sanitizeServerEvent(actor, event, properties);

    if (sanitized) {
      await capture(posthog, actor, event, sanitized);
    }
  });
}

/** Sets the `tenant` group's properties (at signup, onboarding and sign-in). */
export function identifyServerTenantGroup(tenantId: string, properties: TenantGroupProperties) {
  const sanitized = pickDeclaredProperties(tenantGroupProperties, properties);

  schedule(async (posthog) => {
    posthog.groupIdentify({
      groupType: TENANT_GROUP_TYPE,
      groupKey: tenantId,
      properties: sanitized,
      disableGeoip: true,
    });
    await posthog.flush();
  });
}
