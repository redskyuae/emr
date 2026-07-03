import { beforeEach, describe, expect, it } from 'vitest';

import { deactivatePermission, seedOrganization } from '@/test/helpers';
import { permissionRepository } from '../../permission/repository/permission-repository';
import { roleRepository } from '../../role/repository/role-repository';
import { rolePermissionRepository } from './role-permission-repository';

const tenantA = 'tenant-a-role-perm-test';
const tenantB = 'tenant-b-role-perm-test';

beforeEach(async () => {
  await seedOrganization(tenantA);
  await seedOrganization(tenantB);
});

describe('Role-Permission repository', () => {
  it('should assign permissions to a role', async () => {
    await permissionRepository.seedPermissionCatalogue();
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const permissions = await permissionRepository.getPermissions();
    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const firstRole = roles.data[0];
    if (!firstRole) {
      throw new Error('No roles found');
    }

    const permissionIds = permissions.slice(0, 3).map((p) => p.id);

    const assigned = await rolePermissionRepository.assignPermissions(
      firstRole.id,
      tenantA,
      permissionIds
    );

    expect(assigned).toHaveLength(3);
    expect(assigned.every((p) => 'module' in p && 'resource' in p && 'action' in p)).toBe(true);
  });

  it('should not duplicate existing permission assignments', async () => {
    await permissionRepository.seedPermissionCatalogue();
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const permissions = await permissionRepository.getPermissions();
    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const firstRole = roles.data[0];
    if (!firstRole) {
      throw new Error('No roles found');
    }

    const permissionIds = permissions.slice(0, 2).map((p) => p.id);

    await rolePermissionRepository.assignPermissions(firstRole.id, tenantA, permissionIds);
    // Assign again - should not duplicate
    await rolePermissionRepository.assignPermissions(firstRole.id, tenantA, permissionIds);

    const assigned = await rolePermissionRepository.getAssignedPermissionsByRole(
      firstRole.id,
      tenantA
    );

    expect(assigned).toHaveLength(2);
  });

  it('should set permissions replacing all existing ones', async () => {
    await permissionRepository.seedPermissionCatalogue();
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const permissions = await permissionRepository.getPermissions();
    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const firstRole = roles.data[0];
    if (!firstRole) {
      throw new Error('No roles found');
    }

    // Initial assignment
    const initialIds = permissions.slice(0, 3).map((p) => p.id);
    await rolePermissionRepository.setPermissions(firstRole.id, tenantA, initialIds);

    let assigned = await rolePermissionRepository.getAssignedPermissionsByRole(
      firstRole.id,
      tenantA
    );
    expect(assigned).toHaveLength(3);

    // Replace with different set
    const newIds = permissions.slice(3, 5).map((p) => p.id);
    await rolePermissionRepository.setPermissions(firstRole.id, tenantA, newIds);

    assigned = await rolePermissionRepository.getAssignedPermissionsByRole(firstRole.id, tenantA);
    expect(assigned).toHaveLength(2);
  });

  it('should clear all permissions when setting empty array', async () => {
    await permissionRepository.seedPermissionCatalogue();
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const permissions = await permissionRepository.getPermissions();
    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const firstRole = roles.data[0];
    if (!firstRole) {
      throw new Error('No roles found');
    }

    const permissionIds = permissions.slice(0, 2).map((p) => p.id);
    await rolePermissionRepository.setPermissions(firstRole.id, tenantA, permissionIds);

    let assigned = await rolePermissionRepository.getAssignedPermissionsByRole(
      firstRole.id,
      tenantA
    );
    expect(assigned).toHaveLength(2);

    // Clear all
    await rolePermissionRepository.setPermissions(firstRole.id, tenantA, []);

    assigned = await rolePermissionRepository.getAssignedPermissionsByRole(firstRole.id, tenantA);
    expect(assigned).toHaveLength(0);
  });

  it('should remove single permission from role', async () => {
    await permissionRepository.seedPermissionCatalogue();
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const permissions = await permissionRepository.getPermissions();
    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const firstRole = roles.data[0];
    if (!firstRole) {
      throw new Error('No roles found');
    }

    const permissionIds = permissions.slice(0, 3).map((p) => p.id);
    await rolePermissionRepository.assignPermissions(firstRole.id, tenantA, permissionIds);

    const toRemove = permissionIds[0];
    const removed = await rolePermissionRepository.removePermission(
      firstRole.id,
      toRemove,
      tenantA
    );

    expect(removed).toMatchObject({
      roleId: firstRole.id,
      permissionId: toRemove,
      tenantId: tenantA,
    });

    const assigned = await rolePermissionRepository.getAssignedPermissionsByRole(
      firstRole.id,
      tenantA
    );
    expect(assigned).toHaveLength(2);
  });

  it('should get assigned permissions by role', async () => {
    await permissionRepository.seedPermissionCatalogue();
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const permissions = await permissionRepository.getPermissions();
    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const firstRole = roles.data[0];
    if (!firstRole) {
      throw new Error('No roles found');
    }

    const permissionIds = permissions.slice(0, 2).map((p) => p.id);
    await rolePermissionRepository.assignPermissions(firstRole.id, tenantA, permissionIds);

    const assigned = await rolePermissionRepository.getAssignedPermissionsByRole(
      firstRole.id,
      tenantA
    );

    expect(assigned).toHaveLength(2);
  });

  it('should return empty array for role with no permissions', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const firstRole = roles.data[0];
    if (!firstRole) {
      throw new Error('No roles found');
    }

    const assigned = await rolePermissionRepository.getAssignedPermissionsByRole(
      firstRole.id,
      tenantA
    );

    expect(assigned).toEqual([]);
  });

  it('should get permission assignment details', async () => {
    await permissionRepository.seedPermissionCatalogue();
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const permissions = await permissionRepository.getPermissions();
    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const firstRole = roles.data[0];
    if (!firstRole) {
      throw new Error('No roles found');
    }

    const permissionIds = permissions.slice(0, 1).map((p) => p.id);
    await rolePermissionRepository.assignPermissions(firstRole.id, tenantA, permissionIds);

    const assignment = await rolePermissionRepository.getPermissionAssignment(
      firstRole.id,
      permissionIds[0],
      tenantA
    );

    expect(assignment).toMatchObject({
      roleId: firstRole.id,
      permissionId: permissionIds[0],
      tenantId: tenantA,
    });
  });

  it('should return undefined for non-existent permission assignment', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const firstRole = roles.data[0];
    if (!firstRole) {
      throw new Error('No roles found');
    }

    const assignment = await rolePermissionRepository.getPermissionAssignment(
      firstRole.id,
      999999,
      tenantA
    );

    expect(assignment).toBeUndefined();
  });

  it('should get active permissions by ids', async () => {
    await permissionRepository.seedPermissionCatalogue();

    const permissions = await permissionRepository.getPermissions();
    const permissionIds = permissions.slice(0, 3).map((p) => p.id);

    const activePermissions =
      await rolePermissionRepository.getActivePermissionsByIds(permissionIds);

    expect(activePermissions).toHaveLength(3);
  });

  it('should return empty array when getting active permissions with empty ids', async () => {
    const result = await rolePermissionRepository.getActivePermissionsByIds([]);
    expect(result).toEqual([]);
  });

  it('should seed default permissions for TENANT_ADMIN system role', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const roles = await roleRepository.seedSystemRolesForTenant(tenantA);

    await expect(
      rolePermissionRepository.seedDefaultPermissionsForSystemRoles(tenantA, roles)
    ).resolves.toBeUndefined();

    const tenantAdminRole = roles.find((r) => r.code === 'TENANT_ADMIN');
    if (!tenantAdminRole) {
      throw new Error('TENANT_ADMIN role not found');
    }

    const assigned = await rolePermissionRepository.getAssignedPermissionsByRole(
      tenantAdminRole.id,
      tenantA
    );

    // TENANT_ADMIN should have ALL permissions
    const allPermissions = await permissionRepository.getPermissions();
    expect(assigned).toHaveLength(allPermissions.length);
  });

  it('should not duplicate default permissions on repeated seed', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const roles = await roleRepository.seedSystemRolesForTenant(tenantA);

    await rolePermissionRepository.seedDefaultPermissionsForSystemRoles(tenantA, roles);
    await rolePermissionRepository.seedDefaultPermissionsForSystemRoles(tenantA, roles);

    const tenantAdminRole = roles.find((r) => r.code === 'TENANT_ADMIN');
    if (!tenantAdminRole) {
      throw new Error('TENANT_ADMIN role not found');
    }

    const assigned = await rolePermissionRepository.getAssignedPermissionsByRole(
      tenantAdminRole.id,
      tenantA
    );

    const allPermissions = await permissionRepository.getPermissions();
    expect(assigned).toHaveLength(allPermissions.length);
  });

  it('should enforce tenant isolation for permission assignments', async () => {
    await permissionRepository.seedPermissionCatalogue();
    await roleRepository.seedSystemRolesForTenant(tenantA);
    await roleRepository.seedSystemRolesForTenant(tenantB);

    const permissions = await permissionRepository.getPermissions();
    const roleA = (await roleRepository.getRoles({ tenantId: tenantA })).data[0];
    const roleB = (await roleRepository.getRoles({ tenantId: tenantB })).data[0];

    if (!roleA || !roleB) {
      throw new Error('Roles not found');
    }

    const permissionIds = permissions.slice(0, 2).map((p) => p.id);

    await rolePermissionRepository.assignPermissions(roleA.id, tenantA, permissionIds);

    // Role A should have permissions
    let assigned = await rolePermissionRepository.getAssignedPermissionsByRole(roleA.id, tenantA);
    expect(assigned).toHaveLength(2);

    // Role B (same ID but different tenant) should not
    assigned = await rolePermissionRepository.getAssignedPermissionsByRole(roleA.id, tenantB);
    expect(assigned).toHaveLength(0);
  });

  it('should only return active permissions when getting assigned by role', async () => {
    await permissionRepository.seedPermissionCatalogue();
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const permissions = await permissionRepository.getPermissions();
    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const firstRole = roles.data[0];
    if (!firstRole) {
      throw new Error('No roles found');
    }

    const permissionIds = permissions.slice(0, 3).map((p) => p.id);
    await rolePermissionRepository.assignPermissions(firstRole.id, tenantA, permissionIds);

    // Deactivate one permission
    const [firstPermissionId] = permissionIds;
    if (firstPermissionId === undefined) {
      throw new Error('No permission ids found');
    }
    await deactivatePermission(firstPermissionId);

    const assigned = await rolePermissionRepository.getAssignedPermissionsByRole(
      firstRole.id,
      tenantA
    );

    // Should only return 2 active permissions
    expect(assigned).toHaveLength(2);
  });

  it('should order assigned permissions by module, resource, action', async () => {
    await permissionRepository.seedPermissionCatalogue();
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const permissions = await permissionRepository.getPermissions();
    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const firstRole = roles.data[0];
    if (!firstRole) {
      throw new Error('No roles found');
    }

    const permissionIds = permissions.map((p) => p.id);
    await rolePermissionRepository.assignPermissions(firstRole.id, tenantA, permissionIds);

    const assigned = await rolePermissionRepository.getAssignedPermissionsByRole(
      firstRole.id,
      tenantA
    );

    // Verify ordering: module -> resource -> action
    for (let i = 1; i < assigned.length; i++) {
      const prev = assigned[i - 1];
      const curr = assigned[i];
      if (!prev || !curr) continue;

      if (prev.module === curr.module) {
        if (prev.resource === curr.resource) {
          expect(prev.action <= curr.action).toBe(true);
        } else {
          expect(prev.resource <= curr.resource).toBe(true);
        }
      } else {
        expect(prev.module <= curr.module).toBe(true);
      }
    }
  });
});
