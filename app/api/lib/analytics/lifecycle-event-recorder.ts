// Records a lifecycle outcome from a route's success branch. The properties are built lazily inside
// a guard, so a builder that throws on an unexpected record shape can never turn a successful
// action into a failed response: the event is simply not recorded.

import type { TenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { AnalyticsEventProperties, ServerEventName } from '@/lib/analytics/catalogue';
import { analyticsActorFromSession, recordServerEvent } from './server-analytics';

export function recordLifecycleEvent<E extends ServerEventName>(
  tenantSession: TenantSession,
  request: Request,
  event: E,
  buildProperties: () => AnalyticsEventProperties<E>
) {
  try {
    recordServerEvent(analyticsActorFromSession(tenantSession, request), event, buildProperties());
  } catch {
    // Analytics never gets in the way of the EMR.
  }
}
