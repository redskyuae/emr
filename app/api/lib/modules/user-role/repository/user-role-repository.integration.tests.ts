import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { user } from '@/app/db/schema/auth';
import { seedOrganization } from '@/test/helpers';

import { roleRepository } from '../../role/repository/role-repository';
import { userRoleRepository } from './user-role-repository';

const tenantA = 'tenant-a-user-role-test';
const tenantB = 'tenant-b-user-role-test';

beforeEach(async () => {
  await seedOrganization(tenantA);
  await seedOrganization(tenantB);
});

const createTestUser = async (email: string, name: string) => {
  const [created] = await db
    .insert(user)
    .values({
      id: randomUUID(),
      email,
      name,
      emailVerified: true,
    })
    .returning({ id: user.id });
  if (!created) throw new Error('createTestUser returned no row');
  return created;
};

describe('User-Role repository', () => {
  it('should assign roles to a user', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const testUser = await createTestUser('test-user-1@example.com', 'Test User 1');

    const roleIds = roles.data.slice(0, 2).map((r) => r.id);

    const assigned = await userRoleRepository.assignRoles(
      testUser.id,
      tenantA,
      roleIds,
      testUser.id
    );

    expect(assigned).toHaveLength(2);
    expect(assigned.every((r) => 'name' in r && 'code' in r)).toBe(true);
  });

  it('should not duplicate existing role assignments', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const testUser = await createTestUser('test-user-2@example.com', 'Test User 2');

    const roleIds = roles.data.slice(0, 2).map((r) => r.id);

    await userRoleRepository.assignRoles(testUser.id, tenantA, roleIds, testUser.id);
    // Assign again - should not duplicate
    await userRoleRepository.assignRoles(testUser.id, tenantA, roleIds, testUser.id);

    const assigned = await userRoleRepository.getAssignedRolesByUser(testUser.id, tenantA);

    expect(assigned).toHaveLength(2);
  });

  it('should get assigned roles for a user', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const testUser = await createTestUser('test-user-3@example.com', 'Test User 3');

    const roleIds = roles.data.slice(0, 3).map((r) => r.id);
    await userRoleRepository.assignRoles(testUser.id, tenantA, roleIds, testUser.id);

    const assigned = await userRoleRepository.getAssignedRolesByUser(testUser.id, tenantA);

    expect(assigned).toHaveLength(3);
    expect(assigned.every((r) => r.tenantId === tenantA)).toBe(true);
  });

  it('should return empty array for user with no roles', async () => {
    const testUser = await createTestUser('test-user-4@example.com', 'Test User 4');

    const assigned = await userRoleRepository.getAssignedRolesByUser(testUser.id, tenantA);

    expect(assigned).toEqual([]);
  });

  it('should remove single role from user', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const testUser = await createTestUser('test-user-5@example.com', 'Test User 5');

    const roleIds = roles.data.slice(0, 3).map((r) => r.id);
    await userRoleRepository.assignRoles(testUser.id, tenantA, roleIds, testUser.id);

    const toRemove = roleIds[0];
    const removed = await userRoleRepository.removeRole(testUser.id, toRemove, tenantA);

    expect(removed).toMatchObject({
      userId: testUser.id,
      roleId: toRemove,
      tenantId: tenantA,
    });

    const assigned = await userRoleRepository.getAssignedRolesByUser(testUser.id, tenantA);
    expect(assigned).toHaveLength(2);
  });

  it('should get role assignment details', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const testUser = await createTestUser('test-user-6@example.com', 'Test User 6');

    const roleIds = roles.data.slice(0, 1).map((r) => r.id);
    await userRoleRepository.assignRoles(testUser.id, tenantA, roleIds, testUser.id);

    const assignment = await userRoleRepository.getRoleAssignment(testUser.id, roleIds[0], tenantA);

    expect(assignment).toMatchObject({
      userId: testUser.id,
      roleId: roleIds[0],
      tenantId: tenantA,
      assignedBy: testUser.id,
    });
  });

  it('should return undefined for non-existent role assignment', async () => {
    const testUser = await createTestUser('test-user-7@example.com', 'Test User 7');

    const assignment = await userRoleRepository.getRoleAssignment(testUser.id, 999999, tenantA);

    expect(assignment).toBeUndefined();
  });

  it('should count role assignments by user', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const testUser = await createTestUser('test-user-8@example.com', 'Test User 8');

    const roleIds = roles.data.slice(0, 3).map((r) => r.id);
    await userRoleRepository.assignRoles(testUser.id, tenantA, roleIds, testUser.id);

    const count = await userRoleRepository.countAssignmentsByUser(testUser.id, tenantA);

    expect(count).toBe(3);
  });

  it('should count role assignments by role', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const testUser1 = await createTestUser('test-user-9a@example.com', 'Test User 9A');
    const testUser2 = await createTestUser('test-user-9b@example.com', 'Test User 9B');
    const testUser3 = await createTestUser('test-user-9c@example.com', 'Test User 9C');

    const roleId = roles.data[0]?.id;
    if (!roleId) {
      throw new Error('No role found');
    }

    await userRoleRepository.assignRoles(testUser1.id, tenantA, [roleId], testUser1.id);
    await userRoleRepository.assignRoles(testUser2.id, tenantA, [roleId], testUser2.id);
    await userRoleRepository.assignRoles(testUser3.id, tenantA, [roleId], testUser3.id);

    const count = await userRoleRepository.countAssignmentsByRole(roleId, tenantA);

    expect(count).toBe(3);
  });

  it('should return zero count for user with no assignments', async () => {
    const testUser = await createTestUser('test-user-10@example.com', 'Test User 10');

    const count = await userRoleRepository.countAssignmentsByUser(testUser.id, tenantA);

    expect(count).toBe(0);
  });

  it('should return zero count for role with no assignments', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const firstRole = roles.data[0];
    if (!firstRole) {
      throw new Error('No role found');
    }

    const count = await userRoleRepository.countAssignmentsByRole(firstRole.id, tenantA);

    expect(count).toBe(0);
  });

  it('should enforce tenant isolation for role assignments', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);
    await roleRepository.seedSystemRolesForTenant(tenantB);

    const rolesA = await roleRepository.getRoles({ tenantId: tenantA });
    const rolesB = await roleRepository.getRoles({ tenantId: tenantB });
    const testUser = await createTestUser('test-user-11@example.com', 'Test User 11');

    const roleIdsA = rolesA.data.slice(0, 2).map((r) => r.id);
    const roleIdsB = rolesB.data.slice(0, 2).map((r) => r.id);

    await userRoleRepository.assignRoles(testUser.id, tenantA, roleIdsA, testUser.id);
    await userRoleRepository.assignRoles(testUser.id, tenantB, roleIdsB, testUser.id);

    const assignedA = await userRoleRepository.getAssignedRolesByUser(testUser.id, tenantA);
    const assignedB = await userRoleRepository.getAssignedRolesByUser(testUser.id, tenantB);

    expect(assignedA).toHaveLength(2);
    expect(assignedB).toHaveLength(2);
    expect(assignedA.every((r) => r.tenantId === tenantA)).toBe(true);
    expect(assignedB.every((r) => r.tenantId === tenantB)).toBe(true);
  });

  it('should not return soft-deleted roles in assignments', async () => {
    // Use non-system roles, since system roles cannot be soft-deleted.
    const roleA = await roleRepository.createRole(tenantA, {
      name: 'Custom A',
      code: 'CUSA',
      description: undefined,
    });
    const roleB = await roleRepository.createRole(tenantA, {
      name: 'Custom B',
      code: 'CUSB',
      description: undefined,
    });
    const testUser = await createTestUser('test-user-12@example.com', 'Test User 12');

    await userRoleRepository.assignRoles(testUser.id, tenantA, [roleA.id, roleB.id], testUser.id);

    // Soft-delete one role
    await roleRepository.deleteRole(roleA.id, tenantA);

    const assigned = await userRoleRepository.getAssignedRolesByUser(testUser.id, tenantA);

    expect(assigned).toHaveLength(1);
    expect(assigned[0]?.id).toBe(roleB.id);
  });

  it('should only count assignments for the specific tenant', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);
    await roleRepository.seedSystemRolesForTenant(tenantB);

    const rolesA = await roleRepository.getRoles({ tenantId: tenantA });
    const rolesB = await roleRepository.getRoles({ tenantId: tenantB });
    const testUser = await createTestUser('test-user-13@example.com', 'Test User 13');

    const roleIdsA = rolesA.data.slice(0, 2).map((r) => r.id);
    const roleIdsB = rolesB.data.slice(0, 1).map((r) => r.id);

    await userRoleRepository.assignRoles(testUser.id, tenantA, roleIdsA, testUser.id);
    await userRoleRepository.assignRoles(testUser.id, tenantB, roleIdsB, testUser.id);

    const countA = await userRoleRepository.countAssignmentsByUser(testUser.id, tenantA);
    const countB = await userRoleRepository.countAssignmentsByUser(testUser.id, tenantB);

    expect(countA).toBe(2);
    expect(countB).toBe(1);
  });

  it('should order assigned roles by name then id', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const testUser = await createTestUser('test-user-14@example.com', 'Test User 14');

    const roleIds = roles.data.map((r) => r.id);
    await userRoleRepository.assignRoles(testUser.id, tenantA, roleIds, testUser.id);

    const assigned = await userRoleRepository.getAssignedRolesByUser(testUser.id, tenantA);

    // Verify ordering: name -> id
    for (let i = 1; i < assigned.length; i++) {
      const prev = assigned[i - 1];
      const curr = assigned[i];
      if (!prev || !curr) continue;

      if (prev.name === curr.name) {
        expect(prev.id <= curr.id).toBe(true);
      } else {
        expect(prev.name <= curr.name).toBe(true);
      }
    }
  });

  it('should include assignedBy and assignedOn in assignment', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const assigningUser = await createTestUser('admin@example.com', 'Admin');
    const targetUser = await createTestUser('target@example.com', 'Target User');

    const roleId = roles.data[0]?.id;
    if (!roleId) {
      throw new Error('No role found');
    }

    await userRoleRepository.assignRoles(targetUser.id, tenantA, [roleId], assigningUser.id);

    const assignment = await userRoleRepository.getRoleAssignment(targetUser.id, roleId, tenantA);

    expect(assignment).toMatchObject({
      assignedBy: assigningUser.id,
      assignedOn: expect.any(Date),
    });
  });

  it('should prevent assigning same role multiple times via unique constraint', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const roles = await roleRepository.getRoles({ tenantId: tenantA });
    const testUser = await createTestUser('test-user-15@example.com', 'Test User 15');

    const roleId = roles.data[0]?.id;
    if (!roleId) {
      throw new Error('No role found');
    }

    // First assignment should succeed
    await userRoleRepository.assignRoles(testUser.id, tenantA, [roleId], testUser.id);

    // Second assignment should not cause error (onConflictDoNothing)
    await expect(
      userRoleRepository.assignRoles(testUser.id, tenantA, [roleId], testUser.id)
    ).resolves.toBeDefined();
  });
});
