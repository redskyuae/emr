import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { visitType as visitTypeTable } from '@/app/db/schema/visit-type';
import type {
  CreateVisitTypeData,
  UpdateVisitTypeData,
  VisitType,
  VisitTypeListParams,
} from '../schemas/visit-type-schema';

const visitTypeColumns = {
  id: visitTypeTable.id,
  name: visitTypeTable.name,
  code: visitTypeTable.code,
  tenantId: visitTypeTable.tenantId,
  createdOn: visitTypeTable.createdOn,
  modifiedOn: visitTypeTable.modifiedOn,
  description: visitTypeTable.description,
};

async function createVisitType(data: CreateVisitTypeData) {
  const [createdVisitType] = await db
    .insert(visitTypeTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
    })
    .returning(visitTypeColumns);

  return createdVisitType;
}

async function updateVisitType(
  id: number,
  data: UpdateVisitTypeData
): Promise<VisitType | undefined> {
  const [updatedVisitType] = await db
    .update(visitTypeTable)
    .set({
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(visitTypeTable.id, id),
        eq(visitTypeTable.tenantId, data.tenantId),
        eq(visitTypeTable.isDeleted, false)
      )
    )
    .returning(visitTypeColumns);

  return updatedVisitType;
}

async function deleteVisitType(id: number, tenantId: string): Promise<VisitType | undefined> {
  const deletedOn = new Date();

  const [deletedVisitType] = await db
    .update(visitTypeTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(visitTypeTable.id, id),
        eq(visitTypeTable.tenantId, tenantId),
        eq(visitTypeTable.isDeleted, false)
      )
    )
    .returning(visitTypeColumns);

  return deletedVisitType;
}

async function getVisitTypeById(id: number, tenantId: string): Promise<VisitType | undefined> {
  const [visitType] = await db
    .select(visitTypeColumns)
    .from(visitTypeTable)
    .where(
      and(
        eq(visitTypeTable.id, id),
        eq(visitTypeTable.tenantId, tenantId),
        eq(visitTypeTable.isDeleted, false)
      )
    )
    .limit(1);

  return visitType;
}

async function getVisitTypes({ tenantId, page = 1, limit = 10, query }: VisitTypeListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(visitTypeTable.name, `%${trimmedQuery}%`),
        ilike(visitTypeTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(visitTypeTable.tenantId, tenantId),
    eq(visitTypeTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(visitTypeColumns)
      .from(visitTypeTable)
      .where(whereClause)
      .orderBy(asc(visitTypeTable.name), asc(visitTypeTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(visitTypeTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<VisitType | undefined> {
  const [visitType] = await db
    .select(visitTypeColumns)
    .from(visitTypeTable)
    .where(
      and(
        eq(visitTypeTable.tenantId, tenantId),
        eq(visitTypeTable.isDeleted, false),
        sql`lower(${visitTypeTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(visitTypeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return visitType;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<VisitType | undefined> {
  const [visitType] = await db
    .select(visitTypeColumns)
    .from(visitTypeTable)
    .where(
      and(
        eq(visitTypeTable.tenantId, tenantId),
        eq(visitTypeTable.isDeleted, false),
        sql`lower(${visitTypeTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(visitTypeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return visitType;
}

type VisitTypeSeed = Omit<CreateVisitTypeData, 'tenantId'>;

async function seedDefaultVisitTypes(tenantId: string, defaults: VisitTypeSeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(visitTypeTable)
    .values(
      defaults.map((visitType) => ({
        tenantId,
        name: visitType.name,
        code: visitType.code,
        description: visitType.description ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const visitTypeRepository = {
  getVisitTypes,
  findActiveByCode,
  findActiveByName,
  createVisitType,
  updateVisitType,
  deleteVisitType,
  getVisitTypeById,
  seedDefaultVisitTypes,
};
