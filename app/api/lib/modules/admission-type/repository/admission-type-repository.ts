import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { admissionType as admissionTypeTable } from '@/app/db/schema/admission-type';
import type {
  CreateAdmissionTypeData,
  UpdateAdmissionTypeData,
  AdmissionType,
  AdmissionTypeListParams,
} from '../schemas/admission-type-schema';

const admissionTypeColumns = {
  id: admissionTypeTable.id,
  name: admissionTypeTable.name,
  code: admissionTypeTable.code,
  tenantId: admissionTypeTable.tenantId,
  createdOn: admissionTypeTable.createdOn,
  modifiedOn: admissionTypeTable.modifiedOn,
  description: admissionTypeTable.description,
};

async function createAdmissionType(data: CreateAdmissionTypeData) {
  const [createdAdmissionType] = await db
    .insert(admissionTypeTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
    })
    .returning(admissionTypeColumns);

  return createdAdmissionType;
}

async function updateAdmissionType(
  id: number,
  data: UpdateAdmissionTypeData
): Promise<AdmissionType | undefined> {
  const [updatedAdmissionType] = await db
    .update(admissionTypeTable)
    .set({
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(admissionTypeTable.id, id),
        eq(admissionTypeTable.tenantId, data.tenantId),
        eq(admissionTypeTable.isDeleted, false)
      )
    )
    .returning(admissionTypeColumns);

  return updatedAdmissionType;
}

async function deleteAdmissionType(
  id: number,
  tenantId: string
): Promise<AdmissionType | undefined> {
  const deletedOn = new Date();

  const [deletedAdmissionType] = await db
    .update(admissionTypeTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(admissionTypeTable.id, id),
        eq(admissionTypeTable.tenantId, tenantId),
        eq(admissionTypeTable.isDeleted, false)
      )
    )
    .returning(admissionTypeColumns);

  return deletedAdmissionType;
}

async function getAdmissionTypeById(
  id: number,
  tenantId: string
): Promise<AdmissionType | undefined> {
  const [admissionType] = await db
    .select(admissionTypeColumns)
    .from(admissionTypeTable)
    .where(
      and(
        eq(admissionTypeTable.id, id),
        eq(admissionTypeTable.tenantId, tenantId),
        eq(admissionTypeTable.isDeleted, false)
      )
    )
    .limit(1);

  return admissionType;
}

async function getAdmissionTypes({
  tenantId,
  page = 1,
  limit = 10,
  query,
}: AdmissionTypeListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(admissionTypeTable.name, `%${trimmedQuery}%`),
        ilike(admissionTypeTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(admissionTypeTable.tenantId, tenantId),
    eq(admissionTypeTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(admissionTypeColumns)
      .from(admissionTypeTable)
      .where(whereClause)
      .orderBy(asc(admissionTypeTable.name), asc(admissionTypeTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(admissionTypeTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<AdmissionType | undefined> {
  const [admissionType] = await db
    .select(admissionTypeColumns)
    .from(admissionTypeTable)
    .where(
      and(
        eq(admissionTypeTable.tenantId, tenantId),
        eq(admissionTypeTable.isDeleted, false),
        sql`lower(${admissionTypeTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(admissionTypeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return admissionType;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<AdmissionType | undefined> {
  const [admissionType] = await db
    .select(admissionTypeColumns)
    .from(admissionTypeTable)
    .where(
      and(
        eq(admissionTypeTable.tenantId, tenantId),
        eq(admissionTypeTable.isDeleted, false),
        sql`lower(${admissionTypeTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(admissionTypeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return admissionType;
}

type AdmissionTypeSeed = Omit<CreateAdmissionTypeData, 'tenantId'>;

async function seedDefaultAdmissionTypes(tenantId: string, defaults: AdmissionTypeSeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(admissionTypeTable)
    .values(
      defaults.map((admissionType) => ({
        tenantId,
        name: admissionType.name,
        code: admissionType.code,
        description: admissionType.description ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const admissionTypeRepository = {
  getAdmissionTypes,
  findActiveByCode,
  findActiveByName,
  createAdmissionType,
  updateAdmissionType,
  deleteAdmissionType,
  getAdmissionTypeById,
  seedDefaultAdmissionTypes,
};
