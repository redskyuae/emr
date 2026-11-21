import type { EventSpec } from '@/lib/analytics/event-spec';

/** Tenant, access and configuration outcomes (signup, sign-in, Staff, Roles, schedules, Masters, Assets), recorded by the server when the action succeeds (#358). */
export const serverAccessEvents = {} as const satisfies Record<string, EventSpec>;
