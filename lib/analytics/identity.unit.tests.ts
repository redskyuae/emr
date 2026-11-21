import { describe, expect, it } from 'vitest';

import { buildAnalyticsIdentity } from './identity';

const currentUser = {
  user: {
    id: 'user_1',
    name: 'Dr Asha Nair',
    email: 'asha@example.com',
    phone: '+971501234567',
    staffProfile: { staffCode: 'D-001', designation: 'Consultant' },
  },
  tenant: {
    id: 'tenant_1',
    name: 'Apollo Hospitals',
    slug: 'apollo',
    isActive: true,
    timeZone: 'Asia/Dubai',
  },
  roles: [
    { id: 1, name: 'Doctor', code: 'DOCTOR' },
    { id: 2, name: 'Front Desk', code: 'FRONT_DESK' },
  ],
  membership: { role: 'member' },
  permissions: ['visit:read'],
};

describe('buildAnalyticsIdentity', () => {
  it('should identify by user id with Role codes and Tenant details only', () => {
    const identity = buildAnalyticsIdentity(currentUser);

    expect(identity).toEqual({
      distinctId: 'user_1',
      person: {
        role_codes: ['DOCTOR', 'FRONT_DESK'],
        membership_role: 'member',
        is_tenant_admin: false,
        has_staff_profile: true,
        tenant_id: 'tenant_1',
        tenant_slug: 'apollo',
      },
      tenant: {
        id: 'tenant_1',
        slug: 'apollo',
        properties: {
          name: 'Apollo Hospitals',
          slug: 'apollo',
          time_zone: 'Asia/Dubai',
          is_active: true,
        },
      },
    });
    expect(JSON.stringify(identity)).not.toMatch(/Asha|example\.com|971|D-001|Consultant/);
  });

  it('should treat owner and admin memberships as Tenant Admins', () => {
    const owner = buildAnalyticsIdentity({ ...currentUser, membership: { role: 'admin, owner' } });
    const admin = buildAnalyticsIdentity({ ...currentUser, membership: { role: 'admin' } });

    expect(owner.person).toMatchObject({ membership_role: 'owner', is_tenant_admin: true });
    expect(admin.person).toMatchObject({ membership_role: 'admin', is_tenant_admin: true });
  });

  it('should report a user without a Staff profile', () => {
    const identity = buildAnalyticsIdentity({
      ...currentUser,
      user: { ...currentUser.user, staffProfile: null },
    });

    expect(identity.person.has_staff_profile).toBe(false);
  });
});
