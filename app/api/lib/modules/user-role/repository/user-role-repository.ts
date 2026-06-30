import { and, asc, count, eq } from 'drizzle-orm';

import { db } from '@/app/db';
import { role as roleTable } from '@/app/db/schema/role';
import { userRole as userRoleTable } from '@/app/db/schema/user-role';
import type { RoleAssignment } from '../schemas/user-role-schema';

const assignedRoleColumns = {
  id: roleTable.id,
  name: roleTable.name,
  code: roleTable.code,
  isSystem: roleTable.isSystem,
  tenantId: roleTable.tenantId,
  description: roleTable.description,
  modifiedOn: roleTable.modifiedOn,
  createdOn: roleTable.createdOn,
};

const roleAssignmentColumns = {
  id: userRoleTable.id,
  userId: userRoleTable.userId,
  roleId: userRoleTable.roleId,
  tenantId: userRoleTable.tenantId,
  createdOn: userRoleTable.createdOn,
  assignedBy: userRoleTable.assignedBy,
  assignedOn: userRoleTable.assignedOn,
};

function orderAssignedRoles() {
  return [asc(roleTable.name), asc(roleTable.id)];
}

async function getAssignedRolesByUser(userId: string, tenantId: string) {
  return db
    .select(assignedRoleColumns)
    .from(userRoleTable)
    .innerJoin(roleTable, eq(userRoleTable.roleId, roleTable.id))
    .where(
      and(
        eq(userRoleTable.userId, userId),
        eq(userRoleTable.tenantId, tenantId),
        eq(roleTable.tenantId, tenantId),
        eq(roleTable.isDeleted, false)
      )
    )
    .orderBy(...orderAssignedRoles());
}

async function getRoleAssignment(
  userId: string,
  roleId: number,
  tenantId: string
): Promise<RoleAssignment | undefined> {
  const [assignment] = await db
    .select(roleAssignmentColumns)
    .from(userRoleTable)
    .where(
      and(
        eq(userRoleTable.userId, userId),
        eq(userRoleTable.roleId, roleId),
        eq(userRoleTable.tenantId, tenantId)
      )
    )
    .limit(1);

  return assignment;
}

async function countAssignmentsByUser(userId: string, tenantId: string) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(userRoleTable)
    .where(and(eq(userRoleTable.userId, userId), eq(userRoleTable.tenantId, tenantId)));

  return total;
}

async function countAssignmentsByRole(roleId: number, tenantId: string) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(userRoleTable)
    .where(and(eq(userRoleTable.roleId, roleId), eq(userRoleTable.tenantId, tenantId)));

  return total;
}

async function assignRoles(
  userId: string,
  tenantId: string,
  roleIds: number[],
  assignedBy: string
) {
  await db
    .insert(userRoleTable)
    .values(roleIds.map((roleId) => ({ userId, roleId, tenantId, assignedBy })))
    .onConflictDoNothing({
      target: [userRoleTable.userId, userRoleTable.roleId, userRoleTable.tenantId],
    });

  return getAssignedRolesByUser(userId, tenantId);
}

async function removeRole(
  userId: string,
  roleId: number,
  tenantId: string
): Promise<RoleAssignment | undefined> {
  const [assignment] = await db
    .delete(userRoleTable)
    .where(
      and(
        eq(userRoleTable.userId, userId),
        eq(userRoleTable.roleId, roleId),
        eq(userRoleTable.tenantId, tenantId)
      )
    )
    .returning(roleAssignmentColumns);

  return assignment;
}

export const userRoleRepository = {
  removeRole,
  assignRoles,
  getRoleAssignment,
  getAssignedRolesByUser,
  countAssignmentsByUser,
  countAssignmentsByRole,
};
