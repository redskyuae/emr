import type { EventSpec } from '@/lib/analytics/event-spec';

/** Step-by-step events inside Appointment booking, Check-in and consultation, recorded by the browser (#359). */
export const funnelEvents = {} as const satisfies Record<string, EventSpec>;
