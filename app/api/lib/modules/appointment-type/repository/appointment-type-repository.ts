import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { appointmentTypeTable } from '@/app/db/schema/appointment-type';
import type {
  AppointmentTypeListParams,
  CreateAppointmentTypeData,
  UpdateAppointmentTypeData,
} from '../schemas/appointment-type-schema';

const appointmentTypeColumns = {
  id: appointmentTypeTable.id,
  tenantId: appointmentTypeTable.tenantId,
  name: appointmentTypeTable.name,
  code: appointmentTypeTable.code,
  description: appointmentTypeTable.description,
  createdOn: appointmentTypeTable.createdOn,
  modifiedOn: appointmentTypeTable.modifiedOn,
};

async function createAppointmentType(data: CreateAppointmentTypeData) {
  const [createdAppointmentType] = await db
    .insert(appointmentTypeTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
    })
    .returning(appointmentTypeColumns);

  return createdAppointmentType;
}

async function updateAppointmentType(id: number, data: UpdateAppointmentTypeData) {
  const [updatedAppointmentType] = await db
    .update(appointmentTypeTable)
    .set({
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(appointmentTypeTable.id, id),
        eq(appointmentTypeTable.tenantId, data.tenantId),
        eq(appointmentTypeTable.isDeleted, false)
      )
    )
    .returning(appointmentTypeColumns);

  return updatedAppointmentType;
}

async function softDeleteAppointmentType(id: number, tenantId: string) {
  const deletedOn = new Date();

  const [deletedAppointmentType] = await db
    .update(appointmentTypeTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(appointmentTypeTable.id, id),
        eq(appointmentTypeTable.tenantId, tenantId),
        eq(appointmentTypeTable.isDeleted, false)
      )
    )
    .returning(appointmentTypeColumns);

  return deletedAppointmentType;
}

async function getAppointmentTypeById(id: number, tenantId: string) {
  const [appointmentType] = await db
    .select(appointmentTypeColumns)
    .from(appointmentTypeTable)
    .where(
      and(
        eq(appointmentTypeTable.id, id),
        eq(appointmentTypeTable.tenantId, tenantId),
        eq(appointmentTypeTable.isDeleted, false)
      )
    )
    .limit(1);

  return appointmentType;
}

async function getAppointmentTypes({
  tenantId,
  page = 1,
  limit = 10,
  query,
}: AppointmentTypeListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(appointmentTypeTable.name, `%${trimmedQuery}%`),
        ilike(appointmentTypeTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(appointmentTypeTable.tenantId, tenantId),
    eq(appointmentTypeTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(appointmentTypeColumns)
      .from(appointmentTypeTable)
      .where(whereClause)
      .orderBy(asc(appointmentTypeTable.name), asc(appointmentTypeTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(appointmentTypeTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [appointmentType] = await db
    .select(appointmentTypeColumns)
    .from(appointmentTypeTable)
    .where(
      and(
        eq(appointmentTypeTable.tenantId, tenantId),
        eq(appointmentTypeTable.isDeleted, false),
        sql`lower(${appointmentTypeTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(appointmentTypeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return appointmentType;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [appointmentType] = await db
    .select(appointmentTypeColumns)
    .from(appointmentTypeTable)
    .where(
      and(
        eq(appointmentTypeTable.tenantId, tenantId),
        eq(appointmentTypeTable.isDeleted, false),
        sql`lower(${appointmentTypeTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(appointmentTypeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return appointmentType;
}

type AppointmentTypeSeed = Omit<CreateAppointmentTypeData, 'tenantId'>;

async function seedDefaultAppointmentTypes(tenantId: string, defaults: AppointmentTypeSeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(appointmentTypeTable)
    .values(
      defaults.map((appointmentType) => ({
        tenantId,
        name: appointmentType.name,
        code: appointmentType.code,
        description: appointmentType.description ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const appointmentTypeRepository = {
  createAppointmentType,
  updateAppointmentType,
  softDeleteAppointmentType,
  getAppointmentTypeById,
  getAppointmentTypes,
  findActiveByName,
  findActiveByCode,
  seedDefaultAppointmentTypes,
};
