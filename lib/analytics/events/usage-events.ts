import type { EventSpec } from '@/lib/analytics/event-spec';

/** Friction and feature-usage events across the app, recorded by the browser (#360). */
export const usageEvents = {} as const satisfies Record<string, EventSpec>;
