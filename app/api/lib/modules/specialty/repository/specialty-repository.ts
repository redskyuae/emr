import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';

type SpecialtyData = {
  code?: string;
  name: string;
  tenantId: string;
  description?: string;
};

type SpecialtyListParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: string;
};

type SpecialtySeed = Omit<SpecialtyData, 'tenantId'>;

const specialtyColumns = {
  id: specialtyTable.id,
  name: specialtyTable.name,
  code: specialtyTable.code,
  tenantId: specialtyTable.tenantId,
  createdOn: specialtyTable.createdOn,
  modifiedOn: specialtyTable.modifiedOn,
  description: specialtyTable.description,
};

async function createSpecialty(data: SpecialtyData) {
  const [createdSpecialty] = await db
    .insert(specialtyTable)
    .values({
      name: data.name,
      code: data.code ?? null,
      tenantId: data.tenantId,
      description: data.description ?? null,
    })
    .returning(specialtyColumns);

  return createdSpecialty;
}

async function updateSpecialty(id: number, data: SpecialtyData) {
  const [updatedSpecialty] = await db
    .update(specialtyTable)
    .set({
      name: data.name,
      code: data.code ?? null,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(specialtyTable.id, id),
        eq(specialtyTable.tenantId, data.tenantId),
        eq(specialtyTable.isDeleted, false)
      )
    )
    .returning(specialtyColumns);

  return updatedSpecialty;
}

async function deleteSpecialty(id: number, tenantId: string) {
  const deletedOn = new Date();

  const [deletedSpecialty] = await db
    .update(specialtyTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(specialtyTable.id, id),
        eq(specialtyTable.tenantId, tenantId),
        eq(specialtyTable.isDeleted, false)
      )
    )
    .returning(specialtyColumns);

  return deletedSpecialty;
}

async function getSpecialtyById(id: number, tenantId: string) {
  const [specialty] = await db
    .select(specialtyColumns)
    .from(specialtyTable)
    .where(
      and(
        eq(specialtyTable.id, id),
        eq(specialtyTable.tenantId, tenantId),
        eq(specialtyTable.isDeleted, false)
      )
    )
    .limit(1);

  return specialty;
}

async function getSpecialties({ tenantId, page = 1, limit = 10, query }: SpecialtyListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(specialtyTable.name, `%${trimmedQuery}%`),
        ilike(specialtyTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(specialtyTable.tenantId, tenantId),
    eq(specialtyTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(specialtyColumns)
      .from(specialtyTable)
      .where(whereClause)
      .orderBy(asc(specialtyTable.name), asc(specialtyTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(specialtyTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [specialty] = await db
    .select(specialtyColumns)
    .from(specialtyTable)
    .where(
      and(
        eq(specialtyTable.tenantId, tenantId),
        eq(specialtyTable.isDeleted, false),
        sql`lower(${specialtyTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(specialtyTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return specialty;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [specialty] = await db
    .select(specialtyColumns)
    .from(specialtyTable)
    .where(
      and(
        eq(specialtyTable.tenantId, tenantId),
        eq(specialtyTable.isDeleted, false),
        sql`lower(${specialtyTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(specialtyTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return specialty;
}

async function seedDefaultSpecialties(tenantId: string, defaults: SpecialtySeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(specialtyTable)
    .values(
      defaults.map((specialty) => ({
        name: specialty.name,
        code: specialty.code ?? null,
        tenantId,
        description: specialty.description ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const specialtyRepository = {
  findActiveByName,
  findActiveByCode,
  getSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
  getSpecialtyById,
  seedDefaultSpecialties,
};
