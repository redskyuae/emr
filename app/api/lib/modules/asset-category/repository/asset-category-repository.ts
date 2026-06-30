import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { assetCategory as assetCategoryTable } from '@/app/db/schema/asset-category';
import type {
  AssetCategory,
  AssetCategoryListParams,
  CreateAssetCategoryData,
  UpdateAssetCategoryData,
} from '../schemas/asset-category-schema';

const assetCategoryColumns = {
  id: assetCategoryTable.id,
  name: assetCategoryTable.name,
  code: assetCategoryTable.code,
  color: assetCategoryTable.color,
  tenantId: assetCategoryTable.tenantId,
  createdOn: assetCategoryTable.createdOn,
  modifiedOn: assetCategoryTable.modifiedOn,
  description: assetCategoryTable.description,
};

async function createAssetCategory(data: CreateAssetCategoryData) {
  const [createdAssetCategory] = await db
    .insert(assetCategoryTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      color: data.color,
      description: data.description ?? null,
    })
    .returning(assetCategoryColumns);

  return createdAssetCategory;
}

async function updateAssetCategory(
  id: number,
  data: UpdateAssetCategoryData
): Promise<AssetCategory | undefined> {
  const [updatedAssetCategory] = await db
    .update(assetCategoryTable)
    .set({
      name: data.name,
      code: data.code,
      color: data.color,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(assetCategoryTable.id, id),
        eq(assetCategoryTable.tenantId, data.tenantId),
        eq(assetCategoryTable.isDeleted, false)
      )
    )
    .returning(assetCategoryColumns);

  return updatedAssetCategory;
}

async function deleteAssetCategory(
  id: number,
  tenantId: string
): Promise<AssetCategory | undefined> {
  const deletedOn = new Date();

  const [deletedAssetCategory] = await db
    .update(assetCategoryTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(assetCategoryTable.id, id),
        eq(assetCategoryTable.tenantId, tenantId),
        eq(assetCategoryTable.isDeleted, false)
      )
    )
    .returning(assetCategoryColumns);

  return deletedAssetCategory;
}

async function getAssetCategoryById(
  id: number,
  tenantId: string
): Promise<AssetCategory | undefined> {
  const [assetCategory] = await db
    .select(assetCategoryColumns)
    .from(assetCategoryTable)
    .where(
      and(
        eq(assetCategoryTable.id, id),
        eq(assetCategoryTable.tenantId, tenantId),
        eq(assetCategoryTable.isDeleted, false)
      )
    )
    .limit(1);

  return assetCategory;
}

async function getAssetCategories({
  tenantId,
  page = 1,
  limit = 10,
  query,
}: AssetCategoryListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(assetCategoryTable.name, `%${trimmedQuery}%`),
        ilike(assetCategoryTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(assetCategoryTable.tenantId, tenantId),
    eq(assetCategoryTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(assetCategoryColumns)
      .from(assetCategoryTable)
      .where(whereClause)
      .orderBy(asc(assetCategoryTable.name), asc(assetCategoryTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(assetCategoryTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<AssetCategory | undefined> {
  const [assetCategory] = await db
    .select(assetCategoryColumns)
    .from(assetCategoryTable)
    .where(
      and(
        eq(assetCategoryTable.tenantId, tenantId),
        eq(assetCategoryTable.isDeleted, false),
        sql`lower(${assetCategoryTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(assetCategoryTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return assetCategory;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<AssetCategory | undefined> {
  const [assetCategory] = await db
    .select(assetCategoryColumns)
    .from(assetCategoryTable)
    .where(
      and(
        eq(assetCategoryTable.tenantId, tenantId),
        eq(assetCategoryTable.isDeleted, false),
        sql`lower(${assetCategoryTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(assetCategoryTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return assetCategory;
}

type AssetCategorySeed = Omit<CreateAssetCategoryData, 'tenantId'>;

async function seedDefaultAssetCategories(tenantId: string, defaults: AssetCategorySeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(assetCategoryTable)
    .values(
      defaults.map((assetCategory) => ({
        tenantId,
        name: assetCategory.name,
        code: assetCategory.code,
        color: assetCategory.color,
        description: assetCategory.description ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const assetCategoryRepository = {
  findActiveByName,
  findActiveByCode,
  getAssetCategories,
  createAssetCategory,
  updateAssetCategory,
  deleteAssetCategory,
  getAssetCategoryById,
  seedDefaultAssetCategories,
};
