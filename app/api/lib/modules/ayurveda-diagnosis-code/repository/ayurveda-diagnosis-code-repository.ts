import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { ayurvedaDiagnosisCode as ayurvedaDiagnosisCodeTable } from '@/app/db/schema/ayurveda-diagnosis-code';
import type {
  CreateAyurvedaDiagnosisCodeData,
  AyurvedaDiagnosisCode,
  AyurvedaDiagnosisCodeListParams,
  UpdateAyurvedaDiagnosisCodeData,
} from '../schemas/ayurveda-diagnosis-code-schema';

const ayurvedaDiagnosisCodeColumns = {
  id: ayurvedaDiagnosisCodeTable.id,
  code: ayurvedaDiagnosisCodeTable.code,
  title: ayurvedaDiagnosisCodeTable.title,
  tenantId: ayurvedaDiagnosisCodeTable.tenantId,
  isActive: ayurvedaDiagnosisCodeTable.isActive,
  createdOn: ayurvedaDiagnosisCodeTable.createdOn,
  modifiedOn: ayurvedaDiagnosisCodeTable.modifiedOn,
  category: ayurvedaDiagnosisCodeTable.category,
};

async function createAyurvedaDiagnosisCode(data: CreateAyurvedaDiagnosisCodeData) {
  const [createdAyurvedaDiagnosisCode] = await db
    .insert(ayurvedaDiagnosisCodeTable)
    .values({
      tenantId: data.tenantId,
      code: data.code,
      title: data.title,
      category: data.category ?? null,
    })
    .returning(ayurvedaDiagnosisCodeColumns);

  return createdAyurvedaDiagnosisCode;
}

async function updateAyurvedaDiagnosisCode(id: number, data: UpdateAyurvedaDiagnosisCodeData) {
  const [updatedAyurvedaDiagnosisCode] = await db
    .update(ayurvedaDiagnosisCodeTable)
    .set({
      code: data.code,
      title: data.title,
      category: data.category ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(ayurvedaDiagnosisCodeTable.id, id),
        eq(ayurvedaDiagnosisCodeTable.tenantId, data.tenantId),
        eq(ayurvedaDiagnosisCodeTable.isDeleted, false)
      )
    )
    .returning(ayurvedaDiagnosisCodeColumns);

  return updatedAyurvedaDiagnosisCode;
}

async function deleteAyurvedaDiagnosisCode(
  id: number,
  tenantId: string
): Promise<AyurvedaDiagnosisCode | undefined> {
  const deletedOn = new Date();

  const [deletedAyurvedaDiagnosisCode] = await db
    .update(ayurvedaDiagnosisCodeTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(ayurvedaDiagnosisCodeTable.id, id),
        eq(ayurvedaDiagnosisCodeTable.tenantId, tenantId),
        eq(ayurvedaDiagnosisCodeTable.isDeleted, false)
      )
    )
    .returning(ayurvedaDiagnosisCodeColumns);

  return deletedAyurvedaDiagnosisCode;
}

async function setAyurvedaDiagnosisCodeActive(
  id: number,
  tenantId: string,
  isActive: boolean
): Promise<AyurvedaDiagnosisCode | undefined> {
  const [updatedAyurvedaDiagnosisCode] = await db
    .update(ayurvedaDiagnosisCodeTable)
    .set({ isActive, modifiedOn: new Date() })
    .where(
      and(
        eq(ayurvedaDiagnosisCodeTable.id, id),
        eq(ayurvedaDiagnosisCodeTable.tenantId, tenantId),
        eq(ayurvedaDiagnosisCodeTable.isDeleted, false)
      )
    )
    .returning(ayurvedaDiagnosisCodeColumns);

  return updatedAyurvedaDiagnosisCode;
}

async function getAyurvedaDiagnosisCodeById(
  id: number,
  tenantId: string
): Promise<AyurvedaDiagnosisCode | undefined> {
  const [ayurvedaDiagnosisCode] = await db
    .select(ayurvedaDiagnosisCodeColumns)
    .from(ayurvedaDiagnosisCodeTable)
    .where(
      and(
        eq(ayurvedaDiagnosisCodeTable.id, id),
        eq(ayurvedaDiagnosisCodeTable.tenantId, tenantId),
        eq(ayurvedaDiagnosisCodeTable.isDeleted, false)
      )
    )
    .limit(1);

  return ayurvedaDiagnosisCode;
}

async function getAyurvedaDiagnosisCodes({
  tenantId,
  page = 1,
  limit = 10,
  query,
  isActive,
}: AyurvedaDiagnosisCodeListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(ayurvedaDiagnosisCodeTable.title, `%${trimmedQuery}%`),
        ilike(ayurvedaDiagnosisCodeTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(ayurvedaDiagnosisCodeTable.tenantId, tenantId),
    eq(ayurvedaDiagnosisCodeTable.isDeleted, false),
    isActive === undefined ? undefined : eq(ayurvedaDiagnosisCodeTable.isActive, isActive),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(ayurvedaDiagnosisCodeColumns)
      .from(ayurvedaDiagnosisCodeTable)
      .where(whereClause)
      .orderBy(asc(ayurvedaDiagnosisCodeTable.code), asc(ayurvedaDiagnosisCodeTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(ayurvedaDiagnosisCodeTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<AyurvedaDiagnosisCode | undefined> {
  const [ayurvedaDiagnosisCode] = await db
    .select(ayurvedaDiagnosisCodeColumns)
    .from(ayurvedaDiagnosisCodeTable)
    .where(
      and(
        eq(ayurvedaDiagnosisCodeTable.tenantId, tenantId),
        eq(ayurvedaDiagnosisCodeTable.isDeleted, false),
        sql`lower(${ayurvedaDiagnosisCodeTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(ayurvedaDiagnosisCodeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return ayurvedaDiagnosisCode;
}

type AyurvedaDiagnosisCodeSeed = Omit<CreateAyurvedaDiagnosisCodeData, 'tenantId'>;

async function seedDefaultAyurvedaDiagnosisCodes(
  tenantId: string,
  defaults: AyurvedaDiagnosisCodeSeed[]
) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(ayurvedaDiagnosisCodeTable)
    .values(
      defaults.map((ayurvedaDiagnosisCode) => ({
        tenantId,
        code: ayurvedaDiagnosisCode.code,
        title: ayurvedaDiagnosisCode.title,
        category: ayurvedaDiagnosisCode.category ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const ayurvedaDiagnosisCodeRepository = {
  findActiveByCode,
  getAyurvedaDiagnosisCodes,
  createAyurvedaDiagnosisCode,
  updateAyurvedaDiagnosisCode,
  deleteAyurvedaDiagnosisCode,
  getAyurvedaDiagnosisCodeById,
  setAyurvedaDiagnosisCodeActive,
  seedDefaultAyurvedaDiagnosisCodes,
};
