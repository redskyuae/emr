import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { assetStatus as assetStatusTable } from '@/app/db/schema/asset-status';
import type {
  AssetStatusListParams,
  CreateAssetStatusData,
  UpdateAssetStatusData,
} from '../schemas/asset-status-schema';

const assetStatusColumns = {
  id: assetStatusTable.id,
  name: assetStatusTable.name,
  code: assetStatusTable.code,
  color: assetStatusTable.color,
  tenantId: assetStatusTable.tenantId,
  createdOn: assetStatusTable.createdOn,
  modifiedOn: assetStatusTable.modifiedOn,
  description: assetStatusTable.description,
};

async function createAssetStatus(data: CreateAssetStatusData) {
  const [createdAssetStatus] = await db
    .insert(assetStatusTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      color: data.color,
      description: data.description ?? null,
    })
    .returning(assetStatusColumns);

  return createdAssetStatus;
}

async function updateAssetStatus(id: number, data: UpdateAssetStatusData) {
  const [updatedAssetStatus] = await db
    .update(assetStatusTable)
    .set({
      name: data.name,
      code: data.code,
      color: data.color,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(assetStatusTable.id, id),
        eq(assetStatusTable.tenantId, data.tenantId),
        eq(assetStatusTable.isDeleted, false)
      )
    )
    .returning(assetStatusColumns);

  return updatedAssetStatus;
}

async function deleteAssetStatus(id: number, tenantId: string) {
  const deletedOn = new Date();

  const [deletedAssetStatus] = await db
    .update(assetStatusTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(assetStatusTable.id, id),
        eq(assetStatusTable.tenantId, tenantId),
        eq(assetStatusTable.isDeleted, false)
      )
    )
    .returning(assetStatusColumns);

  return deletedAssetStatus;
}

async function getAssetStatusById(id: number, tenantId: string) {
  const [assetStatus] = await db
    .select(assetStatusColumns)
    .from(assetStatusTable)
    .where(
      and(
        eq(assetStatusTable.id, id),
        eq(assetStatusTable.tenantId, tenantId),
        eq(assetStatusTable.isDeleted, false)
      )
    )
    .limit(1);

  return assetStatus;
}

async function getAssetStatuses({ tenantId, page = 1, limit = 10, query }: AssetStatusListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(assetStatusTable.name, `%${trimmedQuery}%`),
        ilike(assetStatusTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(assetStatusTable.tenantId, tenantId),
    eq(assetStatusTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(assetStatusColumns)
      .from(assetStatusTable)
      .where(whereClause)
      .orderBy(asc(assetStatusTable.name), asc(assetStatusTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(assetStatusTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [assetStatus] = await db
    .select(assetStatusColumns)
    .from(assetStatusTable)
    .where(
      and(
        eq(assetStatusTable.tenantId, tenantId),
        eq(assetStatusTable.isDeleted, false),
        sql`lower(${assetStatusTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(assetStatusTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return assetStatus;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [assetStatus] = await db
    .select(assetStatusColumns)
    .from(assetStatusTable)
    .where(
      and(
        eq(assetStatusTable.tenantId, tenantId),
        eq(assetStatusTable.isDeleted, false),
        sql`lower(${assetStatusTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(assetStatusTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return assetStatus;
}

type AssetStatusSeed = Omit<CreateAssetStatusData, 'tenantId'>;

async function seedDefaultAssetStatuses(tenantId: string, defaults: AssetStatusSeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(assetStatusTable)
    .values(
      defaults.map((assetStatus) => ({
        tenantId,
        name: assetStatus.name,
        code: assetStatus.code,
        color: assetStatus.color,
        description: assetStatus.description ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const assetStatusRepository = {
  findActiveByName,
  findActiveByCode,
  getAssetStatuses,
  createAssetStatus,
  updateAssetStatus,
  deleteAssetStatus,
  getAssetStatusById,
  seedDefaultAssetStatuses,
};
