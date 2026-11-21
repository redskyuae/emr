// The single typed catalogue of Analytics Events. An event or property that is not declared here is
// never sent: the browser's capture helper and PostHog's before-send hook, and the server's capture
// helper, all drop it. See docs/analytics.md for the rules and for how to add an event.

import type { BrandLogoVariant } from '@/components/brand/brand-config';
import {
  pickDeclaredProperties,
  prop,
  type EventSpec,
  type PropertiesOf,
} from '@/lib/analytics/event-spec';
import { foundationEvents } from '@/lib/analytics/events/foundation-events';
import { funnelEvents } from '@/lib/analytics/events/funnel-events';
import { serverAccessEvents } from '@/lib/analytics/events/server-access-events';
import { serverLifecycleEvents } from '@/lib/analytics/events/server-lifecycle-events';
import { usageEvents } from '@/lib/analytics/events/usage-events';

// Events are grouped in files under `events/` by area and spread in here. Names must be unique
// across files; `catalogue.unit.tests.ts` checks that no spread silently overrides another.
export const analyticsEventGroups = [
  foundationEvents,
  serverLifecycleEvents,
  serverAccessEvents,
  funnelEvents,
  usageEvents,
] as const;

export const analyticsEvents = {
  ...foundationEvents,
  ...serverLifecycleEvents,
  ...serverAccessEvents,
  ...funnelEvents,
  ...usageEvents,
} as const satisfies Record<string, EventSpec>;

const BRAND_VARIANTS = [
  'dhathri-ayurvedic',
  'dhathri-gram',
  'none',
] as const satisfies readonly BrandLogoVariant[];

export const SIDEBAR_MODES = ['appointments_only', 'appointments_and_visits', 'full'] as const;

export type SidebarMode = (typeof SIDEBAR_MODES)[number];

/** Properties every event may carry, set by the capture helpers rather than by the caller. */
export const commonProperties = {
  tenant_id: prop.optional(prop.code()),
  tenant_slug: prop.optional(prop.code()),
  source: prop.enum(['client', 'server']),
  brand_variant: prop.optional(prop.enum(BRAND_VARIANTS)),
  sidebar_mode: prop.optional(prop.enum(SIDEBAR_MODES)),
  route: prop.optional(prop.route()),
  page_group: prop.optional(prop.label()),
  page_title: prop.optional(prop.label()),
  is_impersonated: prop.optional(prop.boolean()),
} as const;

/** Person properties of a signed-in user. Name, email, phone and the rest are never sent. */
export const personProperties = {
  role_codes: prop.codeList(),
  membership_role: prop.enum(['owner', 'admin', 'member']),
  is_tenant_admin: prop.boolean(),
  has_staff_profile: prop.boolean(),
  tenant_id: prop.code(),
  tenant_slug: prop.code(),
} as const;

/** Properties of the `tenant` group. */
export const tenantGroupProperties = {
  name: prop.optional(prop.label()),
  slug: prop.optional(prop.code()),
  time_zone: prop.optional(prop.code()),
  is_active: prop.optional(prop.boolean()),
  created_at: prop.optional(prop.timestamp()),
} as const;

export const TENANT_GROUP_TYPE = 'tenant';

type Catalogue = typeof analyticsEvents;

export type AnalyticsEventName = keyof Catalogue;

export type ClientEventName = {
  [E in AnalyticsEventName]: Catalogue[E]['source'] extends 'client' ? E : never;
}[AnalyticsEventName];

export type ServerEventName = {
  [E in AnalyticsEventName]: Catalogue[E]['source'] extends 'server' ? E : never;
}[AnalyticsEventName];

export type AnalyticsEventProperties<E extends AnalyticsEventName> = PropertiesOf<
  Catalogue[E]['properties']
>;

export type PersonProperties = PropertiesOf<typeof personProperties>;

export type TenantGroupProperties = PropertiesOf<typeof tenantGroupProperties>;

export function isAnalyticsEventName(name: string): name is AnalyticsEventName {
  return Object.hasOwn(analyticsEvents, name);
}

export function getEventSpec(name: string): EventSpec | undefined {
  return isAnalyticsEventName(name) ? analyticsEvents[name] : undefined;
}

/**
 * The event's own declared properties plus the common ones, each checked against its spec.
 * Returns `null` for an event that is not in the catalogue.
 */
export function sanitizeEventProperties(
  name: string,
  properties: Readonly<Record<string, unknown>>
): Record<string, unknown> | null {
  const spec = getEventSpec(name);

  if (!spec) {
    return null;
  }

  return pickDeclaredProperties({ ...commonProperties, ...spec.properties }, properties);
}
