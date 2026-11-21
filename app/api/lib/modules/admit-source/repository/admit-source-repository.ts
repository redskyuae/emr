import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { admitSource as admitSourceTable } from '@/app/db/schema/admit-source';
import type {
  CreateAdmitSourceData,
  UpdateAdmitSourceData,
  AdmitSource,
  AdmitSourceListParams,
} from '../schemas/admit-source-schema';

const admitSourceColumns = {
  id: admitSourceTable.id,
  name: admitSourceTable.name,
  code: admitSourceTable.code,
  tenantId: admitSourceTable.tenantId,
  createdOn: admitSourceTable.createdOn,
  modifiedOn: admitSourceTable.modifiedOn,
  description: admitSourceTable.description,
};

async function createAdmitSource(data: CreateAdmitSourceData) {
  const [createdAdmitSource] = await db
    .insert(admitSourceTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
    })
    .returning(admitSourceColumns);

  return createdAdmitSource;
}

async function updateAdmitSource(
  id: number,
  data: UpdateAdmitSourceData
): Promise<AdmitSource | undefined> {
  const [updatedAdmitSource] = await db
    .update(admitSourceTable)
    .set({
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(admitSourceTable.id, id),
        eq(admitSourceTable.tenantId, data.tenantId),
        eq(admitSourceTable.isDeleted, false)
      )
    )
    .returning(admitSourceColumns);

  return updatedAdmitSource;
}

async function deleteAdmitSource(id: number, tenantId: string): Promise<AdmitSource | undefined> {
  const deletedOn = new Date();

  const [deletedAdmitSource] = await db
    .update(admitSourceTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(admitSourceTable.id, id),
        eq(admitSourceTable.tenantId, tenantId),
        eq(admitSourceTable.isDeleted, false)
      )
    )
    .returning(admitSourceColumns);

  return deletedAdmitSource;
}

async function getAdmitSourceById(id: number, tenantId: string): Promise<AdmitSource | undefined> {
  const [admitSource] = await db
    .select(admitSourceColumns)
    .from(admitSourceTable)
    .where(
      and(
        eq(admitSourceTable.id, id),
        eq(admitSourceTable.tenantId, tenantId),
        eq(admitSourceTable.isDeleted, false)
      )
    )
    .limit(1);

  return admitSource;
}

async function getAdmitSources({ tenantId, page = 1, limit = 10, query }: AdmitSourceListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(admitSourceTable.name, `%${trimmedQuery}%`),
        ilike(admitSourceTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(admitSourceTable.tenantId, tenantId),
    eq(admitSourceTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(admitSourceColumns)
      .from(admitSourceTable)
      .where(whereClause)
      .orderBy(asc(admitSourceTable.name), asc(admitSourceTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(admitSourceTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<AdmitSource | undefined> {
  const [admitSource] = await db
    .select(admitSourceColumns)
    .from(admitSourceTable)
    .where(
      and(
        eq(admitSourceTable.tenantId, tenantId),
        eq(admitSourceTable.isDeleted, false),
        sql`lower(${admitSourceTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(admitSourceTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return admitSource;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<AdmitSource | undefined> {
  const [admitSource] = await db
    .select(admitSourceColumns)
    .from(admitSourceTable)
    .where(
      and(
        eq(admitSourceTable.tenantId, tenantId),
        eq(admitSourceTable.isDeleted, false),
        sql`lower(${admitSourceTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(admitSourceTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return admitSource;
}

type AdmitSourceSeed = Omit<CreateAdmitSourceData, 'tenantId'>;

async function seedDefaultAdmitSources(tenantId: string, defaults: AdmitSourceSeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(admitSourceTable)
    .values(
      defaults.map((admitSource) => ({
        tenantId,
        name: admitSource.name,
        code: admitSource.code,
        description: admitSource.description ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const admitSourceRepository = {
  getAdmitSources,
  findActiveByCode,
  findActiveByName,
  createAdmitSource,
  updateAdmitSource,
  deleteAdmitSource,
  getAdmitSourceById,
  seedDefaultAdmitSources,
};
