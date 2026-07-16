import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { diagnosisCode as diagnosisCodeTable } from '@/app/db/schema/diagnosis-code';
import type {
  CreateDiagnosisCodeData,
  DiagnosisCode,
  DiagnosisCodeListParams,
  UpdateDiagnosisCodeData,
} from '../schemas/diagnosis-code-schema';

const diagnosisCodeColumns = {
  id: diagnosisCodeTable.id,
  code: diagnosisCodeTable.code,
  title: diagnosisCodeTable.title,
  tenantId: diagnosisCodeTable.tenantId,
  createdOn: diagnosisCodeTable.createdOn,
  modifiedOn: diagnosisCodeTable.modifiedOn,
  category: diagnosisCodeTable.category,
};

async function createDiagnosisCode(data: CreateDiagnosisCodeData) {
  const [createdDiagnosisCode] = await db
    .insert(diagnosisCodeTable)
    .values({
      tenantId: data.tenantId,
      code: data.code,
      title: data.title,
      category: data.category ?? null,
    })
    .returning(diagnosisCodeColumns);

  return createdDiagnosisCode;
}

async function updateDiagnosisCode(id: number, data: UpdateDiagnosisCodeData) {
  const [updatedDiagnosisCode] = await db
    .update(diagnosisCodeTable)
    .set({
      code: data.code,
      title: data.title,
      category: data.category ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(diagnosisCodeTable.id, id),
        eq(diagnosisCodeTable.tenantId, data.tenantId),
        eq(diagnosisCodeTable.isDeleted, false)
      )
    )
    .returning(diagnosisCodeColumns);

  return updatedDiagnosisCode;
}

async function deleteDiagnosisCode(
  id: number,
  tenantId: string
): Promise<DiagnosisCode | undefined> {
  const deletedOn = new Date();

  const [deletedDiagnosisCode] = await db
    .update(diagnosisCodeTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(diagnosisCodeTable.id, id),
        eq(diagnosisCodeTable.tenantId, tenantId),
        eq(diagnosisCodeTable.isDeleted, false)
      )
    )
    .returning(diagnosisCodeColumns);

  return deletedDiagnosisCode;
}

async function getDiagnosisCodeById(
  id: number,
  tenantId: string
): Promise<DiagnosisCode | undefined> {
  const [diagnosisCode] = await db
    .select(diagnosisCodeColumns)
    .from(diagnosisCodeTable)
    .where(
      and(
        eq(diagnosisCodeTable.id, id),
        eq(diagnosisCodeTable.tenantId, tenantId),
        eq(diagnosisCodeTable.isDeleted, false)
      )
    )
    .limit(1);

  return diagnosisCode;
}

async function getDiagnosisCodes({
  tenantId,
  page = 1,
  limit = 10,
  query,
}: DiagnosisCodeListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(diagnosisCodeTable.title, `%${trimmedQuery}%`),
        ilike(diagnosisCodeTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(diagnosisCodeTable.tenantId, tenantId),
    eq(diagnosisCodeTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(diagnosisCodeColumns)
      .from(diagnosisCodeTable)
      .where(whereClause)
      .orderBy(asc(diagnosisCodeTable.code), asc(diagnosisCodeTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(diagnosisCodeTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<DiagnosisCode | undefined> {
  const [diagnosisCode] = await db
    .select(diagnosisCodeColumns)
    .from(diagnosisCodeTable)
    .where(
      and(
        eq(diagnosisCodeTable.tenantId, tenantId),
        eq(diagnosisCodeTable.isDeleted, false),
        sql`lower(${diagnosisCodeTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(diagnosisCodeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return diagnosisCode;
}

type DiagnosisCodeSeed = Omit<CreateDiagnosisCodeData, 'tenantId'>;

async function seedDefaultDiagnosisCodes(tenantId: string, defaults: DiagnosisCodeSeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(diagnosisCodeTable)
    .values(
      defaults.map((diagnosisCode) => ({
        tenantId,
        code: diagnosisCode.code,
        title: diagnosisCode.title,
        category: diagnosisCode.category ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const diagnosisCodeRepository = {
  findActiveByCode,
  getDiagnosisCodes,
  createDiagnosisCode,
  updateDiagnosisCode,
  deleteDiagnosisCode,
  getDiagnosisCodeById,
  seedDefaultDiagnosisCodes,
};
