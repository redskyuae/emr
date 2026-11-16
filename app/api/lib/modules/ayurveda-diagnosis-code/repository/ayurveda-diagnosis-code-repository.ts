import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { ayurvedaDiagnosisCode as ayurvedaDiagnosisCodeTable } from '@/app/db/schema/ayurveda-diagnosis-code';
import { diagnosisCode as diagnosisCodeTable } from '@/app/db/schema/diagnosis-code';
import type {
  AyurvedaDiagnosisCode,
  AyurvedaDiagnosisCodeListParams,
  CreateAyurvedaDiagnosisCodeData,
  UpdateAyurvedaDiagnosisCodeData,
} from '../schemas/ayurveda-diagnosis-code-schema';

const ayurvedaDiagnosisCodeColumns = {
  id: ayurvedaDiagnosisCodeTable.id,
  code: ayurvedaDiagnosisCodeTable.code,
  name: ayurvedaDiagnosisCodeTable.name,
  tenantId: ayurvedaDiagnosisCodeTable.tenantId,
  category: ayurvedaDiagnosisCodeTable.category,
  createdOn: ayurvedaDiagnosisCodeTable.createdOn,
  modifiedOn: ayurvedaDiagnosisCodeTable.modifiedOn,
  englishName: ayurvedaDiagnosisCodeTable.englishName,
  icdDiagnosisCode: {
    id: diagnosisCodeTable.id,
    code: diagnosisCodeTable.code,
    title: diagnosisCodeTable.title,
  },
};

// A mapped Diagnosis Code that was later deleted reads as unmapped.
function selectAyurvedaDiagnosisCodes() {
  return db
    .select(ayurvedaDiagnosisCodeColumns)
    .from(ayurvedaDiagnosisCodeTable)
    .leftJoin(
      diagnosisCodeTable,
      and(
        eq(diagnosisCodeTable.id, ayurvedaDiagnosisCodeTable.icdDiagnosisCodeId),
        eq(diagnosisCodeTable.tenantId, ayurvedaDiagnosisCodeTable.tenantId),
        eq(diagnosisCodeTable.isDeleted, false)
      )
    );
}

async function getAyurvedaDiagnosisCodeById(
  id: number,
  tenantId: string
): Promise<AyurvedaDiagnosisCode | undefined> {
  const [ayurvedaDiagnosisCode] = await selectAyurvedaDiagnosisCodes()
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
}: AyurvedaDiagnosisCodeListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(ayurvedaDiagnosisCodeTable.code, `%${trimmedQuery}%`),
        ilike(ayurvedaDiagnosisCodeTable.name, `%${trimmedQuery}%`),
        ilike(ayurvedaDiagnosisCodeTable.englishName, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(ayurvedaDiagnosisCodeTable.tenantId, tenantId),
    eq(ayurvedaDiagnosisCodeTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    selectAyurvedaDiagnosisCodes()
      .where(whereClause)
      .orderBy(asc(ayurvedaDiagnosisCodeTable.code), asc(ayurvedaDiagnosisCodeTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(ayurvedaDiagnosisCodeTable).where(whereClause),
  ]);

  return { data, total };
}

async function createAyurvedaDiagnosisCode(
  data: CreateAyurvedaDiagnosisCodeData
): Promise<AyurvedaDiagnosisCode | undefined> {
  const [created] = await db
    .insert(ayurvedaDiagnosisCodeTable)
    .values({
      code: data.code,
      name: data.name,
      tenantId: data.tenantId,
      category: data.category ?? null,
      englishName: data.englishName ?? null,
      icdDiagnosisCodeId: data.icdDiagnosisCodeId,
    })
    .returning({ id: ayurvedaDiagnosisCodeTable.id });

  return getAyurvedaDiagnosisCodeById(created.id, data.tenantId);
}

async function updateAyurvedaDiagnosisCode(
  id: number,
  data: UpdateAyurvedaDiagnosisCodeData
): Promise<AyurvedaDiagnosisCode | undefined> {
  const [updated] = await db
    .update(ayurvedaDiagnosisCodeTable)
    .set({
      code: data.code,
      name: data.name,
      modifiedOn: new Date(),
      category: data.category ?? null,
      englishName: data.englishName ?? null,
      icdDiagnosisCodeId: data.icdDiagnosisCodeId,
    })
    .where(
      and(
        eq(ayurvedaDiagnosisCodeTable.id, id),
        eq(ayurvedaDiagnosisCodeTable.tenantId, data.tenantId),
        eq(ayurvedaDiagnosisCodeTable.isDeleted, false)
      )
    )
    .returning({ id: ayurvedaDiagnosisCodeTable.id });

  return updated ? getAyurvedaDiagnosisCodeById(updated.id, data.tenantId) : undefined;
}

async function deleteAyurvedaDiagnosisCode(
  id: number,
  tenantId: string
): Promise<{ id: number } | undefined> {
  const deletedOn = new Date();

  const [deleted] = await db
    .update(ayurvedaDiagnosisCodeTable)
    .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
    .where(
      and(
        eq(ayurvedaDiagnosisCodeTable.id, id),
        eq(ayurvedaDiagnosisCodeTable.tenantId, tenantId),
        eq(ayurvedaDiagnosisCodeTable.isDeleted, false)
      )
    )
    .returning({ id: ayurvedaDiagnosisCodeTable.id });

  return deleted;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<{ id: number } | undefined> {
  const [ayurvedaDiagnosisCode] = await db
    .select({ id: ayurvedaDiagnosisCodeTable.id })
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

export const ayurvedaDiagnosisCodeRepository = {
  findActiveByCode,
  getAyurvedaDiagnosisCodes,
  createAyurvedaDiagnosisCode,
  updateAyurvedaDiagnosisCode,
  deleteAyurvedaDiagnosisCode,
  getAyurvedaDiagnosisCodeById,
};
