import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { religion as religionTable } from '@/app/db/schema/religion';
import type {
  CreateReligionInput,
  ReligionListParams,
  UpdateReligionInput,
} from '../schemas/religion-schema';

const religionColumns = {
  id: religionTable.id,
  name: religionTable.name,
  code: religionTable.code,
  createdOn: religionTable.createdOn,
  modifiedOn: religionTable.modifiedOn,
};

async function createReligion(data: CreateReligionInput) {
  const [createdReligion] = await db
    .insert(religionTable)
    .values({
      name: data.name,
      code: data.code,
    })
    .returning(religionColumns);

  return createdReligion;
}

async function updateReligion(id: number, data: UpdateReligionInput) {
  const [updatedReligion] = await db
    .update(religionTable)
    .set({
      name: data.name,
      code: data.code,
      modifiedOn: new Date(),
    })
    .where(and(eq(religionTable.id, id), eq(religionTable.isDeleted, false)))
    .returning(religionColumns);

  return updatedReligion;
}

async function deleteReligion(id: number) {
  const deletedOn = new Date();

  const [deletedReligion] = await db
    .update(religionTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(and(eq(religionTable.id, id), eq(religionTable.isDeleted, false)))
    .returning(religionColumns);

  return deletedReligion;
}

async function getReligionById(id: number) {
  const [religion] = await db
    .select(religionColumns)
    .from(religionTable)
    .where(and(eq(religionTable.id, id), eq(religionTable.isDeleted, false)))
    .limit(1);

  return religion;
}

async function getReligions({ page = 1, limit = 10, query }: ReligionListParams = {}) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(religionTable.name, `%${trimmedQuery}%`),
        ilike(religionTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(eq(religionTable.isDeleted, false), searchCondition);

  const [data, [{ total }]] = await Promise.all([
    db
      .select(religionColumns)
      .from(religionTable)
      .where(whereClause)
      .orderBy(asc(religionTable.name), asc(religionTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(religionTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(name: string, { excludeId }: { excludeId?: number } = {}) {
  const [religion] = await db
    .select(religionColumns)
    .from(religionTable)
    .where(
      and(
        eq(religionTable.isDeleted, false),
        sql`lower(${religionTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(religionTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return religion;
}

async function findActiveByCode(code: string, { excludeId }: { excludeId?: number } = {}) {
  const [religion] = await db
    .select(religionColumns)
    .from(religionTable)
    .where(
      and(
        eq(religionTable.isDeleted, false),
        sql`lower(${religionTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(religionTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return religion;
}

export const religionRepository = {
  getReligions,
  createReligion,
  updateReligion,
  deleteReligion,
  getReligionById,
  findActiveByName,
  findActiveByCode,
};
