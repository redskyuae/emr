import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { nationality as nationalityTable } from '@/app/db/schema/nationality';
import type {
  CreateNationalityInput,
  NationalityListParams,
  UpdateNationalityInput,
} from '../schemas/nationality-schema';

const nationalityColumns = {
  id: nationalityTable.id,
  name: nationalityTable.name,
  code: nationalityTable.code,
  createdOn: nationalityTable.createdOn,
  modifiedOn: nationalityTable.modifiedOn,
};

async function createNationality(data: CreateNationalityInput) {
  const [createdNationality] = await db
    .insert(nationalityTable)
    .values({
      name: data.name,
      code: data.code,
    })
    .returning(nationalityColumns);

  return createdNationality;
}

async function updateNationality(id: number, data: UpdateNationalityInput) {
  const [updatedNationality] = await db
    .update(nationalityTable)
    .set({
      name: data.name,
      code: data.code,
      modifiedOn: new Date(),
    })
    .where(and(eq(nationalityTable.id, id), eq(nationalityTable.isDeleted, false)))
    .returning(nationalityColumns);

  return updatedNationality;
}

async function deleteNationality(id: number) {
  const deletedOn = new Date();

  const [deletedNationality] = await db
    .update(nationalityTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(and(eq(nationalityTable.id, id), eq(nationalityTable.isDeleted, false)))
    .returning(nationalityColumns);

  return deletedNationality;
}

async function getNationalityById(id: number) {
  const [nationality] = await db
    .select(nationalityColumns)
    .from(nationalityTable)
    .where(and(eq(nationalityTable.id, id), eq(nationalityTable.isDeleted, false)))
    .limit(1);

  return nationality;
}

async function getNationalities({ page = 1, limit = 10, query }: NationalityListParams = {}) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(nationalityTable.name, `%${trimmedQuery}%`),
        ilike(nationalityTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(eq(nationalityTable.isDeleted, false), searchCondition);

  const [data, [{ total }]] = await Promise.all([
    db
      .select(nationalityColumns)
      .from(nationalityTable)
      .where(whereClause)
      .orderBy(asc(nationalityTable.name), asc(nationalityTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(nationalityTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(name: string, { excludeId }: { excludeId?: number } = {}) {
  const [nationality] = await db
    .select(nationalityColumns)
    .from(nationalityTable)
    .where(
      and(
        eq(nationalityTable.isDeleted, false),
        sql`lower(${nationalityTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(nationalityTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return nationality;
}

async function findActiveByCode(code: string, { excludeId }: { excludeId?: number } = {}) {
  const [nationality] = await db
    .select(nationalityColumns)
    .from(nationalityTable)
    .where(
      and(
        eq(nationalityTable.isDeleted, false),
        sql`lower(${nationalityTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(nationalityTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return nationality;
}

export const nationalityRepository = {
  findActiveByName,
  findActiveByCode,
  getNationalities,
  createNationality,
  updateNationality,
  deleteNationality,
  getNationalityById,
};
