// `sessions_revoked` when a user ends their own Sessions. Those routes accept any signed-in user,
// so the event is recorded only when the current Session has an Active Tenant to attach it to.

import {
  analyticsActorFromSession,
  recordServerEvent,
} from '@/app/api/lib/analytics/server-analytics';
import type { Session } from '@/app/lib/auth';

export function recordOwnSessionsRevoked(
  session: Session,
  request: Request,
  scope: 'single' | 'all'
) {
  const tenantId = session.session.activeOrganizationId;

  if (tenantId) {
    recordServerEvent(
      analyticsActorFromSession({ session, tenantId }, request),
      'sessions_revoked',
      {
        scope,
      }
    );
  }
}
