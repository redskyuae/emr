import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { assetTable } from '@/app/db/schema/asset';
import { assetCategoryTable } from '@/app/db/schema/asset-category';
import { assetConditionTable } from '@/app/db/schema/asset-condition';
import { assetStatusTable } from '@/app/db/schema/asset-status';
import type { AssetListParams, CreateAssetData, UpdateAssetData } from '../schemas/asset-schema';

const assetColumns = {
  id: assetTable.id,
  tenantId: assetTable.tenantId,
  name: assetTable.name,
  categoryId: assetTable.categoryId,
  statusId: assetTable.statusId,
  conditionId: assetTable.conditionId,
  manufacturer: assetTable.manufacturer,
  model: assetTable.model,
  serialNumber: assetTable.serialNumber,
  facility: assetTable.facility,
  department: assetTable.department,
  location: assetTable.location,
  custodian: assetTable.custodian,
  purchaseDate: assetTable.purchaseDate,
  warrantyExpiry: assetTable.warrantyExpiry,
  cost: assetTable.cost,
  currentValue: assetTable.currentValue,
  lastServiceDate: assetTable.lastServiceDate,
  nextServiceDate: assetTable.nextServiceDate,
  calibrationDate: assetTable.calibrationDate,
  category: {
    id: assetCategoryTable.id,
    name: assetCategoryTable.name,
    color: assetCategoryTable.color,
  },
  status: {
    id: assetStatusTable.id,
    name: assetStatusTable.name,
    color: assetStatusTable.color,
  },
  condition: {
    id: assetConditionTable.id,
    name: assetConditionTable.name,
    color: assetConditionTable.color,
  },
  createdOn: assetTable.createdOn,
  modifiedOn: assetTable.modifiedOn,
};

const assetMasterJoins = () =>
  db
    .select(assetColumns)
    .from(assetTable)
    .innerJoin(
      assetCategoryTable,
      and(
        eq(assetCategoryTable.id, assetTable.categoryId),
        eq(assetCategoryTable.tenantId, assetTable.tenantId),
        eq(assetCategoryTable.isDeleted, false)
      )
    )
    .innerJoin(
      assetStatusTable,
      and(
        eq(assetStatusTable.id, assetTable.statusId),
        eq(assetStatusTable.tenantId, assetTable.tenantId),
        eq(assetStatusTable.isDeleted, false)
      )
    )
    .leftJoin(
      assetConditionTable,
      and(
        eq(assetConditionTable.id, assetTable.conditionId),
        eq(assetConditionTable.tenantId, assetTable.tenantId),
        eq(assetConditionTable.isDeleted, false)
      )
    );

function assetValues(data: CreateAssetData | UpdateAssetData) {
  return {
    tenantId: data.tenantId,
    name: data.name,
    categoryId: data.categoryId,
    statusId: data.statusId,
    conditionId: data.conditionId ?? null,
    manufacturer: data.manufacturer ?? null,
    model: data.model ?? null,
    serialNumber: data.serialNumber,
    facility: data.facility ?? null,
    department: data.department ?? null,
    location: data.location ?? null,
    custodian: data.custodian ?? null,
    purchaseDate: data.purchaseDate ?? null,
    warrantyExpiry: data.warrantyExpiry ?? null,
    cost: data.cost ?? null,
    currentValue: data.currentValue ?? null,
    lastServiceDate: data.lastServiceDate ?? null,
    nextServiceDate: data.nextServiceDate ?? null,
    calibrationDate: data.calibrationDate ?? null,
  };
}

async function createAsset(data: CreateAssetData) {
  const [createdAsset] = await db
    .insert(assetTable)
    .values(assetValues(data))
    .returning({ id: assetTable.id });

  return getAssetById(createdAsset.id, data.tenantId);
}

async function updateAsset(id: number, data: UpdateAssetData) {
  const [updatedAsset] = await db
    .update(assetTable)
    .set({
      ...assetValues(data),
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(assetTable.id, id),
        eq(assetTable.tenantId, data.tenantId),
        eq(assetTable.isDeleted, false)
      )
    )
    .returning({ id: assetTable.id });

  if (!updatedAsset) {
    return undefined;
  }

  return getAssetById(updatedAsset.id, data.tenantId);
}

async function softDeleteAsset(id: number, tenantId: string) {
  const deletedOn = new Date();

  const [deletedAsset] = await db
    .update(assetTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(eq(assetTable.id, id), eq(assetTable.tenantId, tenantId), eq(assetTable.isDeleted, false))
    )
    .returning({ id: assetTable.id });

  return deletedAsset;
}

async function getAssetById(id: number, tenantId: string) {
  const [asset] = await assetMasterJoins()
    .where(
      and(eq(assetTable.id, id), eq(assetTable.tenantId, tenantId), eq(assetTable.isDeleted, false))
    )
    .limit(1);

  return asset;
}

async function getAssets({
  tenantId,
  page = 1,
  limit = 10,
  query,
  categoryId,
  statusId,
}: AssetListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(assetTable.name, `%${trimmedQuery}%`),
        ilike(assetTable.serialNumber, `%${trimmedQuery}%`),
        ilike(assetTable.manufacturer, `%${trimmedQuery}%`),
        ilike(assetTable.model, `%${trimmedQuery}%`),
        ilike(assetTable.facility, `%${trimmedQuery}%`),
        ilike(assetTable.department, `%${trimmedQuery}%`),
        ilike(assetTable.location, `%${trimmedQuery}%`),
        ilike(assetTable.custodian, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(assetTable.tenantId, tenantId),
    eq(assetTable.isDeleted, false),
    categoryId ? eq(assetTable.categoryId, categoryId) : undefined,
    statusId ? eq(assetTable.statusId, statusId) : undefined,
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    assetMasterJoins()
      .where(whereClause)
      .orderBy(asc(assetTable.name), asc(assetTable.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(assetTable)
      .innerJoin(
        assetCategoryTable,
        and(
          eq(assetCategoryTable.id, assetTable.categoryId),
          eq(assetCategoryTable.tenantId, assetTable.tenantId),
          eq(assetCategoryTable.isDeleted, false)
        )
      )
      .innerJoin(
        assetStatusTable,
        and(
          eq(assetStatusTable.id, assetTable.statusId),
          eq(assetStatusTable.tenantId, assetTable.tenantId),
          eq(assetStatusTable.isDeleted, false)
        )
      )
      .leftJoin(
        assetConditionTable,
        and(
          eq(assetConditionTable.id, assetTable.conditionId),
          eq(assetConditionTable.tenantId, assetTable.tenantId),
          eq(assetConditionTable.isDeleted, false)
        )
      )
      .where(whereClause),
  ]);

  return { data, total };
}

async function findActiveBySerialNumber(
  tenantId: string,
  serialNumber: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [asset] = await db
    .select({ id: assetTable.id, serialNumber: assetTable.serialNumber })
    .from(assetTable)
    .where(
      and(
        eq(assetTable.tenantId, tenantId),
        eq(assetTable.isDeleted, false),
        sql`lower(${assetTable.serialNumber}) = ${serialNumber.toLowerCase()}`,
        excludeId ? ne(assetTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return asset;
}

export const assetRepository = {
  createAsset,
  updateAsset,
  softDeleteAsset,
  getAssetById,
  getAssets,
  findActiveBySerialNumber,
};
