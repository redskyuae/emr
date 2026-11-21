// Tenant analytics shared by signup, sign-in, onboarding and the Tenant routes.

import {
  analyticsActorFromSession,
  identifyServerTenantGroup,
  recordServerEvent,
} from '@/app/api/lib/analytics/server-analytics';
import type { Tenant } from '@/app/api/lib/modules/tenant/schemas/tenant-schema';
import type { Session } from '@/app/lib/auth';

const MS_PER_MINUTE = 60 * 1000;

/** Sets the `tenant` group's properties from the Tenant's display details. */
export function identifyTenantGroup(tenant: Tenant) {
  identifyServerTenantGroup(tenant.id, {
    name: tenant.name,
    slug: tenant.slug,
    time_zone: tenant.timeZone,
    is_active: tenant.isActive,
    created_at: tenant.createdAt.toISOString(),
  });
}

/** Whole minutes from signup (the Tenant's creation) to `now`, never negative. */
export function minutesSinceSignup(tenant: Pick<Tenant, 'createdAt'>, now: Date = new Date()) {
  return Math.max(0, Math.floor((now.getTime() - tenant.createdAt.getTime()) / MS_PER_MINUTE));
}

/**
 * Records a change to the Tenant's own details by a Tenant Owner and refreshes the group's
 * properties. The Tenant routes resolve no Active Tenant, so the event is attached to the changed
 * Tenant.
 */
export function recordTenantChanged(
  session: Session,
  request: Request,
  tenant: Tenant,
  event: 'tenant_profile_updated' | 'tenant_deactivated' | 'tenant_reactivated'
) {
  recordServerEvent(
    analyticsActorFromSession({ session, tenantId: tenant.id }, request),
    event,
    {}
  );
  identifyTenantGroup(tenant);
}
