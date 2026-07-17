import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { ward as wardTable } from '@/app/db/schema/ward';
import type { CreateWardData, UpdateWardData, Ward, WardListParams } from '../schemas/ward-schema';

const wardColumns = {
  id: wardTable.id,
  name: wardTable.name,
  code: wardTable.code,
  tenantId: wardTable.tenantId,
  createdOn: wardTable.createdOn,
  modifiedOn: wardTable.modifiedOn,
  description: wardTable.description,
};

async function createWard(data: CreateWardData) {
  const [createdWard] = await db
    .insert(wardTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
    })
    .returning(wardColumns);

  return createdWard;
}

async function updateWard(id: number, data: UpdateWardData): Promise<Ward | undefined> {
  const [updatedWard] = await db
    .update(wardTable)
    .set({
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(wardTable.id, id),
        eq(wardTable.tenantId, data.tenantId),
        eq(wardTable.isDeleted, false)
      )
    )
    .returning(wardColumns);

  return updatedWard;
}

async function deleteWard(id: number, tenantId: string): Promise<Ward | undefined> {
  const deletedOn = new Date();

  const [deletedWard] = await db
    .update(wardTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(eq(wardTable.id, id), eq(wardTable.tenantId, tenantId), eq(wardTable.isDeleted, false))
    )
    .returning(wardColumns);

  return deletedWard;
}

async function getWardById(id: number, tenantId: string): Promise<Ward | undefined> {
  const [ward] = await db
    .select(wardColumns)
    .from(wardTable)
    .where(
      and(eq(wardTable.id, id), eq(wardTable.tenantId, tenantId), eq(wardTable.isDeleted, false))
    )
    .limit(1);

  return ward;
}

async function getWards({ tenantId, page = 1, limit = 10, query }: WardListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(ilike(wardTable.name, `%${trimmedQuery}%`), ilike(wardTable.code, `%${trimmedQuery}%`))
    : undefined;
  const whereClause = and(
    eq(wardTable.tenantId, tenantId),
    eq(wardTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(wardColumns)
      .from(wardTable)
      .where(whereClause)
      .orderBy(asc(wardTable.name), asc(wardTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(wardTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<Ward | undefined> {
  const [ward] = await db
    .select(wardColumns)
    .from(wardTable)
    .where(
      and(
        eq(wardTable.tenantId, tenantId),
        eq(wardTable.isDeleted, false),
        sql`lower(${wardTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(wardTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return ward;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<Ward | undefined> {
  const [ward] = await db
    .select(wardColumns)
    .from(wardTable)
    .where(
      and(
        eq(wardTable.tenantId, tenantId),
        eq(wardTable.isDeleted, false),
        sql`lower(${wardTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(wardTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return ward;
}

export const wardRepository = {
  getWards,
  findActiveByCode,
  findActiveByName,
  createWard,
  updateWard,
  deleteWard,
  getWardById,
};
