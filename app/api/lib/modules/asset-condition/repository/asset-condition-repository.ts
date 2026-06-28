import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { assetConditionTable } from '@/app/db/schema/asset-condition';
import type {
  AssetConditionListParams,
  CreateAssetConditionData,
  UpdateAssetConditionData,
} from '../schemas/asset-condition-schema';

const assetConditionColumns = {
  id: assetConditionTable.id,
  tenantId: assetConditionTable.tenantId,
  name: assetConditionTable.name,
  code: assetConditionTable.code,
  color: assetConditionTable.color,
  description: assetConditionTable.description,
  createdOn: assetConditionTable.createdOn,
  modifiedOn: assetConditionTable.modifiedOn,
};

async function createAssetCondition(data: CreateAssetConditionData) {
  const [createdAssetCondition] = await db
    .insert(assetConditionTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      color: data.color,
      description: data.description ?? null,
    })
    .returning(assetConditionColumns);

  return createdAssetCondition;
}

async function updateAssetCondition(id: number, data: UpdateAssetConditionData) {
  const [updatedAssetCondition] = await db
    .update(assetConditionTable)
    .set({
      name: data.name,
      code: data.code,
      color: data.color,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(assetConditionTable.id, id),
        eq(assetConditionTable.tenantId, data.tenantId),
        eq(assetConditionTable.isDeleted, false)
      )
    )
    .returning(assetConditionColumns);

  return updatedAssetCondition;
}

async function deleteAssetCondition(id: number, tenantId: string) {
  const deletedOn = new Date();

  const [deletedAssetCondition] = await db
    .update(assetConditionTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(assetConditionTable.id, id),
        eq(assetConditionTable.tenantId, tenantId),
        eq(assetConditionTable.isDeleted, false)
      )
    )
    .returning(assetConditionColumns);

  return deletedAssetCondition;
}

async function getAssetConditionById(id: number, tenantId: string) {
  const [assetCondition] = await db
    .select(assetConditionColumns)
    .from(assetConditionTable)
    .where(
      and(
        eq(assetConditionTable.id, id),
        eq(assetConditionTable.tenantId, tenantId),
        eq(assetConditionTable.isDeleted, false)
      )
    )
    .limit(1);

  return assetCondition;
}

async function getAssetConditions({
  tenantId,
  page = 1,
  limit = 10,
  query,
}: AssetConditionListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(assetConditionTable.name, `%${trimmedQuery}%`),
        ilike(assetConditionTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(assetConditionTable.tenantId, tenantId),
    eq(assetConditionTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(assetConditionColumns)
      .from(assetConditionTable)
      .where(whereClause)
      .orderBy(asc(assetConditionTable.name), asc(assetConditionTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(assetConditionTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [assetCondition] = await db
    .select(assetConditionColumns)
    .from(assetConditionTable)
    .where(
      and(
        eq(assetConditionTable.tenantId, tenantId),
        eq(assetConditionTable.isDeleted, false),
        sql`lower(${assetConditionTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(assetConditionTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return assetCondition;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [assetCondition] = await db
    .select(assetConditionColumns)
    .from(assetConditionTable)
    .where(
      and(
        eq(assetConditionTable.tenantId, tenantId),
        eq(assetConditionTable.isDeleted, false),
        sql`lower(${assetConditionTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(assetConditionTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return assetCondition;
}

type AssetConditionSeed = Omit<CreateAssetConditionData, 'tenantId'>;

async function seedDefaultAssetConditions(tenantId: string, defaults: AssetConditionSeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(assetConditionTable)
    .values(
      defaults.map((assetCondition) => ({
        tenantId,
        name: assetCondition.name,
        code: assetCondition.code,
        color: assetCondition.color,
        description: assetCondition.description ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const assetConditionRepository = {
  createAssetCondition,
  updateAssetCondition,
  deleteAssetCondition,
  getAssetConditionById,
  getAssetConditions,
  findActiveByName,
  findActiveByCode,
  seedDefaultAssetConditions,
};
