import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/app/db';
import { user } from '@/app/db/schema/auth';
import { permissionTable } from '@/app/db/schema/permission';
import { rolePermissionTable } from '@/app/db/schema/role-permission';

const authUserColumns = {
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image,
  phone: user.phone,
  emailVerified: user.emailVerified,
};

const permissionKeyColumns = {
  action: permissionTable.action,
  resource: permissionTable.resource,
};

function toPermissionKey(row: { resource: string; action: string }) {
  return `${row.resource}:${row.action}`;
}

async function getAuthUserById(userId: string) {
  const [authUser] = await db
    .select(authUserColumns)
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return authUser;
}

async function getAllActivePermissionKeys() {
  const rows = await db
    .select(permissionKeyColumns)
    .from(permissionTable)
    .where(eq(permissionTable.isActive, true));

  return rows.map(toPermissionKey);
}

async function getPermissionKeysByRoleIds(roleIds: number[], tenantId: string) {
  if (roleIds.length === 0) {
    return [];
  }

  const rows = await db
    .selectDistinct(permissionKeyColumns)
    .from(rolePermissionTable)
    .innerJoin(permissionTable, eq(rolePermissionTable.permissionId, permissionTable.id))
    .where(
      and(
        inArray(rolePermissionTable.roleId, roleIds),
        eq(rolePermissionTable.tenantId, tenantId),
        eq(permissionTable.isActive, true)
      )
    );

  return rows.map(toPermissionKey);
}

export const currentUserRepository = {
  getAuthUserById,
  getAllActivePermissionKeys,
  getPermissionKeysByRoleIds,
};
