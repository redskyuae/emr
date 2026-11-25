import { prop, type EventSpec } from '@/lib/analytics/event-spec';

export const SIGN_OUT_TRIGGERS = [
  'user',
  'stale_tab',
  'idle_timeout',
  'session_expired',
  'tab_storage_unavailable',
] as const;

export type SignOutTrigger = (typeof SIGN_OUT_TRIGGERS)[number];

/** Page views, identity changes and failed sign-in attempts, recorded by the browser. */
export const foundationEvents = {
  $pageview: {
    source: 'client',
    properties: { is_demo_page: prop.boolean() },
  },
  $pageleave: {
    source: 'client',
    properties: {},
  },
  sign_in_failed: {
    source: 'client',
    properties: {
      status: prop.optional(prop.status()),
      failure_kind: prop.enum([
        'invalid_credentials',
        'no_active_tenant',
        'multiple_active_tenants',
        'other',
      ]),
    },
  },
  signup_failed: {
    source: 'client',
    properties: {
      status: prop.optional(prop.status()),
      failure_kind: prop.enum(['validation', 'conflict', 'other']),
    },
  },
  signed_out: {
    source: 'client',
    properties: { trigger: prop.enum(SIGN_OUT_TRIGGERS) },
  },
} as const satisfies Record<string, EventSpec>;
