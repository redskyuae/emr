import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { appointmentReason as appointmentReasonTable } from '@/app/db/schema/appointment-reason';
import type {
  AppointmentReason,
  AppointmentReasonListParams,
  CreateAppointmentReasonData,
  UpdateAppointmentReasonData,
} from '../schemas/appointment-reason-schema';

const appointmentReasonColumns = {
  id: appointmentReasonTable.id,
  name: appointmentReasonTable.name,
  code: appointmentReasonTable.code,
  tenantId: appointmentReasonTable.tenantId,
  createdOn: appointmentReasonTable.createdOn,
  modifiedOn: appointmentReasonTable.modifiedOn,
  description: appointmentReasonTable.description,
};

async function createAppointmentReason(data: CreateAppointmentReasonData) {
  const [createdAppointmentReason] = await db
    .insert(appointmentReasonTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
    })
    .returning(appointmentReasonColumns);

  return createdAppointmentReason;
}

async function updateAppointmentReason(id: number, data: UpdateAppointmentReasonData) {
  const [updatedAppointmentReason] = await db
    .update(appointmentReasonTable)
    .set({
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(appointmentReasonTable.id, id),
        eq(appointmentReasonTable.tenantId, data.tenantId),
        eq(appointmentReasonTable.isDeleted, false)
      )
    )
    .returning(appointmentReasonColumns);

  return updatedAppointmentReason;
}

async function deleteAppointmentReason(
  id: number,
  tenantId: string
): Promise<AppointmentReason | undefined> {
  const deletedOn = new Date();

  const [deletedAppointmentReason] = await db
    .update(appointmentReasonTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(appointmentReasonTable.id, id),
        eq(appointmentReasonTable.tenantId, tenantId),
        eq(appointmentReasonTable.isDeleted, false)
      )
    )
    .returning(appointmentReasonColumns);

  return deletedAppointmentReason;
}

async function getAppointmentReasonById(
  id: number,
  tenantId: string
): Promise<AppointmentReason | undefined> {
  const [appointmentReason] = await db
    .select(appointmentReasonColumns)
    .from(appointmentReasonTable)
    .where(
      and(
        eq(appointmentReasonTable.id, id),
        eq(appointmentReasonTable.tenantId, tenantId),
        eq(appointmentReasonTable.isDeleted, false)
      )
    )
    .limit(1);

  return appointmentReason;
}

async function getAppointmentReasons({
  tenantId,
  page = 1,
  limit = 10,
  query,
}: AppointmentReasonListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(appointmentReasonTable.name, `%${trimmedQuery}%`),
        ilike(appointmentReasonTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(appointmentReasonTable.tenantId, tenantId),
    eq(appointmentReasonTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(appointmentReasonColumns)
      .from(appointmentReasonTable)
      .where(whereClause)
      .orderBy(asc(appointmentReasonTable.name), asc(appointmentReasonTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(appointmentReasonTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<AppointmentReason | undefined> {
  const [appointmentReason] = await db
    .select(appointmentReasonColumns)
    .from(appointmentReasonTable)
    .where(
      and(
        eq(appointmentReasonTable.tenantId, tenantId),
        eq(appointmentReasonTable.isDeleted, false),
        sql`lower(${appointmentReasonTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(appointmentReasonTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return appointmentReason;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<AppointmentReason | undefined> {
  const [appointmentReason] = await db
    .select(appointmentReasonColumns)
    .from(appointmentReasonTable)
    .where(
      and(
        eq(appointmentReasonTable.tenantId, tenantId),
        eq(appointmentReasonTable.isDeleted, false),
        sql`lower(${appointmentReasonTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(appointmentReasonTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return appointmentReason;
}

type AppointmentReasonSeed = Omit<CreateAppointmentReasonData, 'tenantId'>;

async function seedDefaultAppointmentReasons(tenantId: string, defaults: AppointmentReasonSeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(appointmentReasonTable)
    .values(
      defaults.map((appointmentReason) => ({
        tenantId,
        name: appointmentReason.name,
        code: appointmentReason.code,
        description: appointmentReason.description ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const appointmentReasonRepository = {
  findActiveByName,
  findActiveByCode,
  getAppointmentReasons,
  createAppointmentReason,
  updateAppointmentReason,
  deleteAppointmentReason,
  getAppointmentReasonById,
  seedDefaultAppointmentReasons,
};
