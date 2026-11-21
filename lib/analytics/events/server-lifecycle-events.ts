import type { EventSpec } from '@/lib/analytics/event-spec';

/** Business outcomes of Appointments, Visits and clinical records, Patients, Admissions and Billing, recorded by the server when the action succeeds (#358). */
export const serverLifecycleEvents = {} as const satisfies Record<string, EventSpec>;
