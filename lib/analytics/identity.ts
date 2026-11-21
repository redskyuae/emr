// What PostHog learns about a signed-in user: the internal user id, Role codes and Tenant Owner or
// Admin status, and the Tenant's display details. Name, email, phone, photo, gender, date of
// birth, staff code and designation never leave the system.

import type { PersonProperties, TenantGroupProperties } from '@/lib/analytics/catalogue';

/** The fields of the Current User the identity reads. The rest are deliberately not accepted. */
export type IdentitySource = {
  user: { id: string; staffProfile: unknown };
  tenant: { id: string; name: string; slug: string; isActive: boolean; timeZone: string };
  roles: readonly { code: string }[];
  membership: { role: string };
};

export type AnalyticsIdentity = {
  distinctId: string;
  person: PersonProperties;
  tenant: { id: string; slug: string; properties: TenantGroupProperties };
};

function membershipRoles(role: string) {
  return role.split(',').map((value) => value.trim());
}

function membershipRole(role: string): PersonProperties['membership_role'] {
  const roles = membershipRoles(role);

  if (roles.includes('owner')) return 'owner';
  if (roles.includes('admin')) return 'admin';
  return 'member';
}

export function buildAnalyticsIdentity(source: IdentitySource): AnalyticsIdentity {
  const role = membershipRole(source.membership.role);

  return {
    distinctId: source.user.id,
    person: {
      role_codes: source.roles.map((item) => item.code),
      membership_role: role,
      is_tenant_admin: role !== 'member',
      has_staff_profile: Boolean(source.user.staffProfile),
      tenant_id: source.tenant.id,
      tenant_slug: source.tenant.slug,
    },
    tenant: {
      id: source.tenant.id,
      slug: source.tenant.slug,
      properties: {
        name: source.tenant.name,
        slug: source.tenant.slug,
        time_zone: source.tenant.timeZone,
        is_active: source.tenant.isActive,
      },
    },
  };
}
