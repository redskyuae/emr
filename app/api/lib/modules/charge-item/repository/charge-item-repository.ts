import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { chargeItem as chargeItemTable } from '@/app/db/schema/charge-item';
import type {
  ChargeItem,
  ChargeItemListParams,
  CreateChargeItemData,
  UpdateChargeItemData,
} from '../schemas/charge-item-schema';

const chargeItemColumns = {
  id: chargeItemTable.id,
  name: chargeItemTable.name,
  code: chargeItemTable.code,
  tenantId: chargeItemTable.tenantId,
  category: chargeItemTable.category,
  unitPrice: chargeItemTable.unitPrice,
  isActive: chargeItemTable.isActive,
  description: chargeItemTable.description,
  createdOn: chargeItemTable.createdOn,
  modifiedOn: chargeItemTable.modifiedOn,
};

async function createChargeItem(data: CreateChargeItemData) {
  const [createdChargeItem] = await db
    .insert(chargeItemTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      category: data.category,
      unitPrice: data.unitPrice,
      description: data.description ?? null,
      isActive: data.isActive,
    })
    .returning(chargeItemColumns);

  return createdChargeItem;
}

async function updateChargeItem(
  id: number,
  data: UpdateChargeItemData
): Promise<ChargeItem | undefined> {
  const [updatedChargeItem] = await db
    .update(chargeItemTable)
    .set({
      name: data.name,
      code: data.code,
      category: data.category,
      unitPrice: data.unitPrice,
      description: data.description ?? null,
      isActive: data.isActive,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(chargeItemTable.id, id),
        eq(chargeItemTable.tenantId, data.tenantId),
        eq(chargeItemTable.isDeleted, false)
      )
    )
    .returning(chargeItemColumns);

  return updatedChargeItem;
}

async function deleteChargeItem(id: number, tenantId: string): Promise<ChargeItem | undefined> {
  const deletedOn = new Date();

  const [deletedChargeItem] = await db
    .update(chargeItemTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(chargeItemTable.id, id),
        eq(chargeItemTable.tenantId, tenantId),
        eq(chargeItemTable.isDeleted, false)
      )
    )
    .returning(chargeItemColumns);

  return deletedChargeItem;
}

async function getChargeItemById(id: number, tenantId: string): Promise<ChargeItem | undefined> {
  const [chargeItem] = await db
    .select(chargeItemColumns)
    .from(chargeItemTable)
    .where(
      and(
        eq(chargeItemTable.id, id),
        eq(chargeItemTable.tenantId, tenantId),
        eq(chargeItemTable.isDeleted, false)
      )
    )
    .limit(1);

  return chargeItem;
}

async function getChargeItems({
  tenantId,
  page = 1,
  limit = 10,
  query,
  category,
  isActive,
}: ChargeItemListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(chargeItemTable.name, `%${trimmedQuery}%`),
        ilike(chargeItemTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(chargeItemTable.tenantId, tenantId),
    eq(chargeItemTable.isDeleted, false),
    category ? eq(chargeItemTable.category, category) : undefined,
    isActive === undefined ? undefined : eq(chargeItemTable.isActive, isActive),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(chargeItemColumns)
      .from(chargeItemTable)
      .where(whereClause)
      .orderBy(asc(chargeItemTable.name), asc(chargeItemTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(chargeItemTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<ChargeItem | undefined> {
  const [chargeItem] = await db
    .select(chargeItemColumns)
    .from(chargeItemTable)
    .where(
      and(
        eq(chargeItemTable.tenantId, tenantId),
        eq(chargeItemTable.isDeleted, false),
        sql`lower(${chargeItemTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(chargeItemTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return chargeItem;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<ChargeItem | undefined> {
  const [chargeItem] = await db
    .select(chargeItemColumns)
    .from(chargeItemTable)
    .where(
      and(
        eq(chargeItemTable.tenantId, tenantId),
        eq(chargeItemTable.isDeleted, false),
        sql`lower(${chargeItemTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(chargeItemTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return chargeItem;
}

export const chargeItemRepository = {
  getChargeItems,
  findActiveByCode,
  findActiveByName,
  createChargeItem,
  updateChargeItem,
  deleteChargeItem,
  getChargeItemById,
};
