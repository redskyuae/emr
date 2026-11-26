import { describe, expect, it } from 'vitest';

import { permissionRepository } from '@/app/api/lib/modules/permission/repository/permission-repository';
import { permissionSeedData } from '@/app/api/lib/modules/permission/seed-data';
import { rolePermissionRepository } from '@/app/api/lib/modules/role-permission/repository/role-permission-repository';
import { roleRepository } from '@/app/api/lib/modules/role/repository/role-repository';
import { userRoleRepository } from '@/app/api/lib/modules/user-role/repository/user-role-repository';
import { addOrganizationMember, createTestUser, seedOrganization } from '@/test/helpers';
import { getCurrentUserQuery } from './get-current-user-query';

const tenantId = 'tenant-current-user-admin-test';
const catalogueNames = permissionSeedData.map(({ name }) => name).sort();

async function onboardTenant() {
  await permissionRepository.seedPermissionCatalogue();
  await seedOrganization(tenantId);
  const roles = await roleRepository.seedSystemRolesForTenant(tenantId);
  await rolePermissionRepository.seedDefaultPermissionsForSystemRoles(tenantId, roles);

  return roles;
}

async function getPermissions(userId: string) {
  const result = await getCurrentUserQuery(userId, tenantId);

  if (!result.success) {
    throw new Error(result.errors.join(', '));
  }

  return result.data.permissions;
}

describe('getCurrentUserQuery Administrator permissions', () => {
  it('should return every catalogue Permission for the Tenant owner', async () => {
    await onboardTenant();
    const owner = await createTestUser();
    await addOrganizationMember(tenantId, owner.id, 'owner');

    expect(await getPermissions(owner.id)).toEqual(catalogueNames);
  });

  it('should return every catalogue Permission for a member with the Tenant Admin Role', async () => {
    const roles = await onboardTenant();
    const tenantAdminRole = roles.find(({ code }) => code === 'TENANT_ADMIN');
    const administrator = await createTestUser();
    await addOrganizationMember(tenantId, administrator.id, 'member');
    await userRoleRepository.assignRoles(
      administrator.id,
      tenantId,
      [tenantAdminRole!.id],
      administrator.id
    );

    const permissions = await getPermissions(administrator.id);

    expect(permissions).toEqual(catalogueNames);
    expect(permissions).toEqual(
      expect.arrayContaining([
        'dashboard:read',
        'previous-visit:read',
        'report:read',
        'visit-document:upload',
        'visit-diagnosis:update',
        'patient-chart:read',
        'patient-timeline:read',
        'appointment:cancel',
        'appointment:reschedule',
        'appointment:export',
        'doctor-slot:read',
      ])
    );
  });
});
