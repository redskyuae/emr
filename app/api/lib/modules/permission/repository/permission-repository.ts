import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/app/db';
import { permissionTable } from '@/app/db/schema/permission';
import type { PermissionListParams } from '../schemas/permission-schema';

const permissionColumns = {
  id: permissionTable.id,
  module: permissionTable.module,
  resource: permissionTable.resource,
  action: permissionTable.action,
  name: permissionTable.name,
  description: permissionTable.description,
  isActive: permissionTable.isActive,
  createdOn: permissionTable.createdOn,
  modifiedOn: permissionTable.modifiedOn,
};

async function getPermissionById(id: number) {
  const [permission] = await db
    .select(permissionColumns)
    .from(permissionTable)
    .where(and(eq(permissionTable.id, id), eq(permissionTable.isActive, true)))
    .limit(1);

  return permission;
}

async function getPermissions({ module }: PermissionListParams = {}) {
  const trimmedModule = module?.trim();

  return db
    .select(permissionColumns)
    .from(permissionTable)
    .where(
      and(
        eq(permissionTable.isActive, true),
        trimmedModule ? eq(permissionTable.module, trimmedModule) : undefined
      )
    )
    .orderBy(
      asc(permissionTable.module),
      asc(permissionTable.resource),
      asc(permissionTable.action),
      asc(permissionTable.id)
    );
}

export const permissionRepository = {
  getPermissionById,
  getPermissions,
};
