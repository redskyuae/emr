import { and, asc, count, eq } from 'drizzle-orm';

import { db } from '@/app/db';
import { roleTable } from '@/app/db/schema/role';
import { userRoleTable } from '@/app/db/schema/user-role';

const assignedRoleColumns = {
  id: roleTable.id,
  tenantId: roleTable.tenantId,
  name: roleTable.name,
  code: roleTable.code,
  description: roleTable.description,
  isSystem: roleTable.isSystem,
  createdOn: roleTable.createdOn,
  modifiedOn: roleTable.modifiedOn,
};

const roleAssignmentColumns = {
  id: userRoleTable.id,
  userId: userRoleTable.userId,
  roleId: userRoleTable.roleId,
  tenantId: userRoleTable.tenantId,
  assignedBy: userRoleTable.assignedBy,
  assignedOn: userRoleTable.assignedOn,
  createdOn: userRoleTable.createdOn,
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

async function getRoleAssignment(userId: string, roleId: number, tenantId: string) {
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

async function removeRole(userId: string, roleId: number, tenantId: string) {
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
  getAssignedRolesByUser,
  getRoleAssignment,
  countAssignmentsByUser,
  countAssignmentsByRole,
  assignRoles,
  removeRole,
};
