// `master_record_changed` for every Master and Global Reference route. Only the module name, the
// action and, for a Charge Item, its category are sent: never the record's id, name or code (the
// clinical catalogues hold codes and names typed by staff).

import {
  analyticsActorFromSession,
  recordServerEvent,
  recordServerEventForCurrentSession,
} from '@/app/api/lib/analytics/server-analytics';
import type { TenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { AnalyticsEventProperties } from '@/lib/analytics/catalogue';

type MasterRecordChange = AnalyticsEventProperties<'master_record_changed'>;

/** Records a change to a Tenant-scoped Master from the route's success branch. */
export function recordMasterRecordChanged(
  tenantSession: TenantSession,
  request: Request,
  change: MasterRecordChange
) {
  recordServerEvent(analyticsActorFromSession(tenantSession, request), 'master_record_changed', {
    master: change.master,
    action: change.action,
    charge_item_category: change.charge_item_category,
  });
}

/**
 * Records a change to a Global Reference (Country, State, Language, Nationality, Religion). Those
 * routes resolve no Session, so it is read after the response and the event is recorded only for
 * a signed-in user with an Active Tenant.
 */
export function recordGlobalReferenceChanged(
  request: Request,
  change: Pick<MasterRecordChange, 'master' | 'action'>
) {
  recordServerEventForCurrentSession(request, 'master_record_changed', {
    master: change.master,
    action: change.action,
  });
}
