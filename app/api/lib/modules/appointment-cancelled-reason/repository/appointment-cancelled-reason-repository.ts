import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { appointmentCancelledReason as appointmentCancelledReasonTable } from '@/app/db/schema/appointment-cancelled-reason';
import type {
  AppointmentCancelledReasonListParams,
  CreateAppointmentCancelledReasonData,
  UpdateAppointmentCancelledReasonData,
} from '../schemas/appointment-cancelled-reason-schema';

const appointmentCancelledReasonColumns = {
  id: appointmentCancelledReasonTable.id,
  name: appointmentCancelledReasonTable.name,
  code: appointmentCancelledReasonTable.code,
  tenantId: appointmentCancelledReasonTable.tenantId,
  createdOn: appointmentCancelledReasonTable.createdOn,
  modifiedOn: appointmentCancelledReasonTable.modifiedOn,
  description: appointmentCancelledReasonTable.description,
};

async function createAppointmentCancelledReason(data: CreateAppointmentCancelledReasonData) {
  const [createdAppointmentCancelledReason] = await db
    .insert(appointmentCancelledReasonTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
    })
    .returning(appointmentCancelledReasonColumns);

  return createdAppointmentCancelledReason;
}

async function updateAppointmentCancelledReason(
  id: number,
  data: UpdateAppointmentCancelledReasonData
) {
  const [updatedAppointmentCancelledReason] = await db
    .update(appointmentCancelledReasonTable)
    .set({
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(appointmentCancelledReasonTable.id, id),
        eq(appointmentCancelledReasonTable.tenantId, data.tenantId),
        eq(appointmentCancelledReasonTable.isDeleted, false)
      )
    )
    .returning(appointmentCancelledReasonColumns);

  return updatedAppointmentCancelledReason;
}

async function deleteAppointmentCancelledReason(id: number, tenantId: string) {
  const deletedOn = new Date();

  const [deletedAppointmentCancelledReason] = await db
    .update(appointmentCancelledReasonTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(appointmentCancelledReasonTable.id, id),
        eq(appointmentCancelledReasonTable.tenantId, tenantId),
        eq(appointmentCancelledReasonTable.isDeleted, false)
      )
    )
    .returning(appointmentCancelledReasonColumns);

  return deletedAppointmentCancelledReason;
}

async function getAppointmentCancelledReasonById(id: number, tenantId: string) {
  const [appointmentCancelledReason] = await db
    .select(appointmentCancelledReasonColumns)
    .from(appointmentCancelledReasonTable)
    .where(
      and(
        eq(appointmentCancelledReasonTable.id, id),
        eq(appointmentCancelledReasonTable.tenantId, tenantId),
        eq(appointmentCancelledReasonTable.isDeleted, false)
      )
    )
    .limit(1);

  return appointmentCancelledReason;
}

async function getAppointmentCancelledReasons({
  tenantId,
  page = 1,
  limit = 10,
  query,
}: AppointmentCancelledReasonListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(appointmentCancelledReasonTable.name, `%${trimmedQuery}%`),
        ilike(appointmentCancelledReasonTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(appointmentCancelledReasonTable.tenantId, tenantId),
    eq(appointmentCancelledReasonTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(appointmentCancelledReasonColumns)
      .from(appointmentCancelledReasonTable)
      .where(whereClause)
      .orderBy(asc(appointmentCancelledReasonTable.name), asc(appointmentCancelledReasonTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(appointmentCancelledReasonTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [appointmentCancelledReason] = await db
    .select(appointmentCancelledReasonColumns)
    .from(appointmentCancelledReasonTable)
    .where(
      and(
        eq(appointmentCancelledReasonTable.tenantId, tenantId),
        eq(appointmentCancelledReasonTable.isDeleted, false),
        sql`lower(${appointmentCancelledReasonTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(appointmentCancelledReasonTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return appointmentCancelledReason;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [appointmentCancelledReason] = await db
    .select(appointmentCancelledReasonColumns)
    .from(appointmentCancelledReasonTable)
    .where(
      and(
        eq(appointmentCancelledReasonTable.tenantId, tenantId),
        eq(appointmentCancelledReasonTable.isDeleted, false),
        sql`lower(${appointmentCancelledReasonTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(appointmentCancelledReasonTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return appointmentCancelledReason;
}

type AppointmentCancelledReasonSeed = Omit<CreateAppointmentCancelledReasonData, 'tenantId'>;

async function seedDefaultAppointmentCancelledReasons(
  tenantId: string,
  defaults: AppointmentCancelledReasonSeed[]
) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(appointmentCancelledReasonTable)
    .values(
      defaults.map((appointmentCancelledReason) => ({
        tenantId,
        name: appointmentCancelledReason.name,
        code: appointmentCancelledReason.code,
        description: appointmentCancelledReason.description ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const appointmentCancelledReasonRepository = {
  findActiveByName,
  findActiveByCode,
  getAppointmentCancelledReasons,
  createAppointmentCancelledReason,
  updateAppointmentCancelledReason,
  deleteAppointmentCancelledReason,
  getAppointmentCancelledReasonById,
  seedDefaultAppointmentCancelledReasons,
};
