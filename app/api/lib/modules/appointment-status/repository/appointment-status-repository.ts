import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { appointmentStatusTable } from '@/app/db/schema/appointment-status';
import type {
  AppointmentStatusListParams,
  CreateAppointmentStatusInput,
  UpdateAppointmentStatusInput,
} from '../schemas/appointment-status-schema';

const appointmentStatusColumns = {
  id: appointmentStatusTable.id,
  tenantId: appointmentStatusTable.tenantId,
  name: appointmentStatusTable.name,
  code: appointmentStatusTable.code,
  description: appointmentStatusTable.description,
  createdOn: appointmentStatusTable.createdOn,
  modifiedOn: appointmentStatusTable.modifiedOn,
};

async function createAppointmentStatus(data: CreateAppointmentStatusInput) {
  const [createdAppointmentStatus] = await db
    .insert(appointmentStatusTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
    })
    .returning(appointmentStatusColumns);

  return createdAppointmentStatus;
}

async function updateAppointmentStatus(id: number, data: UpdateAppointmentStatusInput) {
  const [updatedAppointmentStatus] = await db
    .update(appointmentStatusTable)
    .set({
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(appointmentStatusTable.id, id),
        eq(appointmentStatusTable.tenantId, data.tenantId),
        eq(appointmentStatusTable.isDeleted, false)
      )
    )
    .returning(appointmentStatusColumns);

  return updatedAppointmentStatus;
}

async function softDeleteAppointmentStatus(id: number, tenantId: string) {
  const deletedOn = new Date();

  const [deletedAppointmentStatus] = await db
    .update(appointmentStatusTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(appointmentStatusTable.id, id),
        eq(appointmentStatusTable.tenantId, tenantId),
        eq(appointmentStatusTable.isDeleted, false)
      )
    )
    .returning(appointmentStatusColumns);

  return deletedAppointmentStatus;
}

async function getAppointmentStatusById(id: number, tenantId: string) {
  const [appointmentStatus] = await db
    .select(appointmentStatusColumns)
    .from(appointmentStatusTable)
    .where(
      and(
        eq(appointmentStatusTable.id, id),
        eq(appointmentStatusTable.tenantId, tenantId),
        eq(appointmentStatusTable.isDeleted, false)
      )
    )
    .limit(1);

  return appointmentStatus;
}

async function getAppointmentStatuses({
  tenantId,
  page = 1,
  limit = 10,
  query,
}: AppointmentStatusListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(appointmentStatusTable.name, `%${trimmedQuery}%`),
        ilike(appointmentStatusTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(appointmentStatusTable.tenantId, tenantId),
    eq(appointmentStatusTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(appointmentStatusColumns)
      .from(appointmentStatusTable)
      .where(whereClause)
      .orderBy(asc(appointmentStatusTable.name), asc(appointmentStatusTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(appointmentStatusTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [appointmentStatus] = await db
    .select(appointmentStatusColumns)
    .from(appointmentStatusTable)
    .where(
      and(
        eq(appointmentStatusTable.tenantId, tenantId),
        eq(appointmentStatusTable.isDeleted, false),
        sql`lower(${appointmentStatusTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(appointmentStatusTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return appointmentStatus;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [appointmentStatus] = await db
    .select(appointmentStatusColumns)
    .from(appointmentStatusTable)
    .where(
      and(
        eq(appointmentStatusTable.tenantId, tenantId),
        eq(appointmentStatusTable.isDeleted, false),
        sql`lower(${appointmentStatusTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(appointmentStatusTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return appointmentStatus;
}

export const appointmentStatusRepository = {
  createAppointmentStatus,
  updateAppointmentStatus,
  softDeleteAppointmentStatus,
  getAppointmentStatusById,
  getAppointmentStatuses,
  findActiveByName,
  findActiveByCode,
};
