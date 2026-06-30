import { and, asc, eq, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { permission as permissionTable } from '@/app/db/schema/permission';
import type { Permission, PermissionListParams } from '../schemas/permission-schema';
import { permissionSeedData, permissionSeedOrder } from '../seed-data';

const permissionColumns = {
  id: permissionTable.id,
  name: permissionTable.name,
  module: permissionTable.module,
  action: permissionTable.action,
  resource: permissionTable.resource,
  isActive: permissionTable.isActive,
  createdOn: permissionTable.createdOn,
  modifiedOn: permissionTable.modifiedOn,
  description: permissionTable.description,
};

async function getPermissionById(id: number): Promise<Permission | undefined> {
  const [permission] = await db
    .select(permissionColumns)
    .from(permissionTable)
    .where(and(eq(permissionTable.id, id), eq(permissionTable.isActive, true)))
    .limit(1);

  return permission;
}

function getSeedOrder(permissionName: string) {
  return permissionSeedOrder.get(permissionName) ?? Number.MAX_SAFE_INTEGER;
}

async function getPermissions({ module }: PermissionListParams = {}) {
  const trimmedModule = module?.trim();

  const permissions = await db
    .select(permissionColumns)
    .from(permissionTable)
    .where(
      and(
        eq(permissionTable.isActive, true),
        trimmedModule ? eq(permissionTable.module, trimmedModule) : undefined
      )
    )
    .orderBy(asc(permissionTable.id));

  return permissions.sort((left, right) => {
    const orderDelta = getSeedOrder(left.name) - getSeedOrder(right.name);

    if (orderDelta !== 0) {
      return orderDelta;
    }

    return left.name.localeCompare(right.name);
  });
}

async function seedPermissionCatalogue() {
  await db
    .insert(permissionTable)
    .values([...permissionSeedData])
    .onConflictDoUpdate({
      target: permissionTable.name,
      set: {
        module: sql`excluded.module`,
        resource: sql`excluded.resource`,
        action: sql`excluded.action`,
        description: sql`excluded.description`,
        isActive: true,
        modifiedOn: new Date(),
      },
      setWhere: or(
        ne(permissionTable.module, sql`excluded.module`),
        ne(permissionTable.resource, sql`excluded.resource`),
        ne(permissionTable.action, sql`excluded.action`),
        sql`${permissionTable.description} is distinct from excluded.description`,
        ne(permissionTable.isActive, true)
      ),
    });
}

export const permissionRepository = {
  getPermissions,
  getPermissionById,
  seedPermissionCatalogue,
};
