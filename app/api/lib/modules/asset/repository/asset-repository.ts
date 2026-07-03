import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { asset as assetTable } from '@/app/db/schema/asset';
import { assetCategory as assetCategoryTable } from '@/app/db/schema/asset-category';
import { assetCondition as assetConditionTable } from '@/app/db/schema/asset-condition';
import { assetStatus as assetStatusTable } from '@/app/db/schema/asset-status';
import { workOrder as workOrderTable } from '@/app/db/schema/work-order';
import { workOrderStatus as workOrderStatusTable } from '@/app/db/schema/work-order-status';
import type {
  Asset,
  AssetSummary,
  AssetListParams,
  CreateAssetData,
  UpdateAssetData,
} from '../schemas/asset-schema';

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
    name: data.name,
    cost: data.cost ?? null,
    tenantId: data.tenantId,
    statusId: data.statusId,
    model: data.model ?? null,
    categoryId: data.categoryId,
    facility: data.facility ?? null,
    location: data.location ?? null,
    serialNumber: data.serialNumber,
    custodian: data.custodian ?? null,
    department: data.department ?? null,
    conditionId: data.conditionId ?? null,
    manufacturer: data.manufacturer ?? null,
    currentValue: data.currentValue ?? null,
    purchaseDate: data.purchaseDate ?? null,
    warrantyExpiry: data.warrantyExpiry ?? null,
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

async function deleteAsset(id: number, tenantId: string) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: assetTable.id })
      .from(assetTable)
      .where(
        and(
          eq(assetTable.id, id),
          eq(assetTable.tenantId, tenantId),
          eq(assetTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!existing) return { outcome: 'not-found' as const };

    const [usage] = await tx
      .select({ id: workOrderTable.id })
      .from(workOrderTable)
      .innerJoin(
        workOrderStatusTable,
        and(
          eq(workOrderStatusTable.id, workOrderTable.statusId),
          eq(workOrderStatusTable.tenantId, workOrderTable.tenantId),
          eq(workOrderStatusTable.isDeleted, false)
        )
      )
      .where(
        and(
          eq(workOrderTable.assetId, id),
          eq(workOrderTable.tenantId, tenantId),
          eq(workOrderTable.isDeleted, false),
          ne(workOrderStatusTable.category, 'COMPLETED')
        )
      )
      .limit(1);

    if (usage) return { outcome: 'in-use' as const };

    const deletedOn = new Date();
    const [deleted] = await tx
      .update(assetTable)
      .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
      .where(
        and(
          eq(assetTable.id, id),
          eq(assetTable.tenantId, tenantId),
          eq(assetTable.isDeleted, false)
        )
      )
      .returning({ id: assetTable.id });

    return deleted
      ? { outcome: 'deleted' as const, data: deleted }
      : { outcome: 'not-found' as const };
  });
}

async function getAssetById(id: number, tenantId: string): Promise<Asset | undefined> {
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

async function getAssetSummary(tenantId: string): Promise<AssetSummary> {
  const [[summary], byCategory] = await Promise.all([
    db
      .select({
        totalAssets: count(),
        portfolioValue: sql<number>`coalesce(sum(${assetTable.currentValue}), 0)`.mapWith(Number),
        outOfServiceCount:
          sql<number>`count(*) filter (where ${assetStatusTable.code} in ('MAINT', 'REPAIR'))`.mapWith(
            Number
          ),
      })
      .from(assetTable)
      .leftJoin(
        assetStatusTable,
        and(
          eq(assetStatusTable.id, assetTable.statusId),
          eq(assetStatusTable.tenantId, assetTable.tenantId),
          eq(assetStatusTable.isDeleted, false)
        )
      )
      .where(and(eq(assetTable.tenantId, tenantId), eq(assetTable.isDeleted, false))),
    db
      .select({
        name: assetCategoryTable.name,
        color: assetCategoryTable.color,
        count: count(assetTable.id),
        categoryId: assetCategoryTable.id,
      })
      .from(assetCategoryTable)
      .leftJoin(
        assetTable,
        and(
          eq(assetTable.categoryId, assetCategoryTable.id),
          eq(assetTable.tenantId, assetCategoryTable.tenantId),
          eq(assetTable.isDeleted, false)
        )
      )
      .where(
        and(eq(assetCategoryTable.tenantId, tenantId), eq(assetCategoryTable.isDeleted, false))
      )
      .groupBy(assetCategoryTable.id, assetCategoryTable.name, assetCategoryTable.color)
      .orderBy(asc(assetCategoryTable.name)),
  ]);

  return { ...summary, byCategory };
}

async function findActiveBySerialNumber(
  tenantId: string,
  serialNumber: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<{ id: number; serialNumber: string } | undefined> {
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
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetById,
  getAssetSummary,
  findActiveBySerialNumber,
};
