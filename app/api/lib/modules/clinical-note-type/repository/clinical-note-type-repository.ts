import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { clinicalNoteType as clinicalNoteTypeTable } from '@/app/db/schema/clinical-note-type';
import type {
  ClinicalNoteType,
  ClinicalNoteTypeListParams,
  CreateClinicalNoteTypeData,
  UpdateClinicalNoteTypeData,
} from '../schemas/clinical-note-type-schema';

const clinicalNoteTypeColumns = {
  id: clinicalNoteTypeTable.id,
  code: clinicalNoteTypeTable.code,
  name: clinicalNoteTypeTable.name,
  tenantId: clinicalNoteTypeTable.tenantId,
  createdOn: clinicalNoteTypeTable.createdOn,
  modifiedOn: clinicalNoteTypeTable.modifiedOn,
  description: clinicalNoteTypeTable.description,
};

async function createClinicalNoteType(data: CreateClinicalNoteTypeData) {
  const [createdClinicalNoteType] = await db
    .insert(clinicalNoteTypeTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
    })
    .returning(clinicalNoteTypeColumns);

  return createdClinicalNoteType;
}

async function updateClinicalNoteType(id: number, data: UpdateClinicalNoteTypeData) {
  const [updatedClinicalNoteType] = await db
    .update(clinicalNoteTypeTable)
    .set({
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(clinicalNoteTypeTable.id, id),
        eq(clinicalNoteTypeTable.tenantId, data.tenantId),
        eq(clinicalNoteTypeTable.isDeleted, false)
      )
    )
    .returning(clinicalNoteTypeColumns);

  return updatedClinicalNoteType;
}

async function deleteClinicalNoteType(
  id: number,
  tenantId: string
): Promise<ClinicalNoteType | undefined> {
  const deletedOn = new Date();

  const [deletedClinicalNoteType] = await db
    .update(clinicalNoteTypeTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(clinicalNoteTypeTable.id, id),
        eq(clinicalNoteTypeTable.tenantId, tenantId),
        eq(clinicalNoteTypeTable.isDeleted, false)
      )
    )
    .returning(clinicalNoteTypeColumns);

  return deletedClinicalNoteType;
}

async function getClinicalNoteTypeById(
  id: number,
  tenantId: string
): Promise<ClinicalNoteType | undefined> {
  const [clinicalNoteType] = await db
    .select(clinicalNoteTypeColumns)
    .from(clinicalNoteTypeTable)
    .where(
      and(
        eq(clinicalNoteTypeTable.id, id),
        eq(clinicalNoteTypeTable.tenantId, tenantId),
        eq(clinicalNoteTypeTable.isDeleted, false)
      )
    )
    .limit(1);

  return clinicalNoteType;
}

async function getClinicalNoteTypes({
  tenantId,
  page = 1,
  limit = 10,
  query,
}: ClinicalNoteTypeListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(clinicalNoteTypeTable.name, `%${trimmedQuery}%`),
        ilike(clinicalNoteTypeTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(clinicalNoteTypeTable.tenantId, tenantId),
    eq(clinicalNoteTypeTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(clinicalNoteTypeColumns)
      .from(clinicalNoteTypeTable)
      .where(whereClause)
      .orderBy(asc(clinicalNoteTypeTable.name), asc(clinicalNoteTypeTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(clinicalNoteTypeTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<ClinicalNoteType | undefined> {
  const [clinicalNoteType] = await db
    .select(clinicalNoteTypeColumns)
    .from(clinicalNoteTypeTable)
    .where(
      and(
        eq(clinicalNoteTypeTable.tenantId, tenantId),
        eq(clinicalNoteTypeTable.isDeleted, false),
        sql`lower(${clinicalNoteTypeTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(clinicalNoteTypeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return clinicalNoteType;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<ClinicalNoteType | undefined> {
  const [clinicalNoteType] = await db
    .select(clinicalNoteTypeColumns)
    .from(clinicalNoteTypeTable)
    .where(
      and(
        eq(clinicalNoteTypeTable.tenantId, tenantId),
        eq(clinicalNoteTypeTable.isDeleted, false),
        sql`lower(${clinicalNoteTypeTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(clinicalNoteTypeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return clinicalNoteType;
}

type ClinicalNoteTypeSeed = Omit<CreateClinicalNoteTypeData, 'tenantId'>;

async function seedDefaultClinicalNoteTypes(tenantId: string, defaults: ClinicalNoteTypeSeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(clinicalNoteTypeTable)
    .values(
      defaults.map((clinicalNoteType) => ({
        tenantId,
        name: clinicalNoteType.name,
        code: clinicalNoteType.code,
        description: clinicalNoteType.description ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const clinicalNoteTypeRepository = {
  findActiveByName,
  findActiveByCode,
  getClinicalNoteTypes,
  createClinicalNoteType,
  updateClinicalNoteType,
  deleteClinicalNoteType,
  getClinicalNoteTypeById,
  seedDefaultClinicalNoteTypes,
};
