import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { appointmentModeTable } from '@/app/db/schema/appointment-mode';
import type {
  AppointmentModeListParams,
  CreateAppointmentModeData,
  UpdateAppointmentModeData,
} from '../schemas/appointment-mode-schema';

const appointmentModeColumns = {
  id: appointmentModeTable.id,
  name: appointmentModeTable.name,
  code: appointmentModeTable.code,
  tenantId: appointmentModeTable.tenantId,
  createdOn: appointmentModeTable.createdOn,
  modifiedOn: appointmentModeTable.modifiedOn,
  description: appointmentModeTable.description,
};

async function createAppointmentMode(data: CreateAppointmentModeData) {
  const [createdAppointmentMode] = await db
    .insert(appointmentModeTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
    })
    .returning(appointmentModeColumns);

  return createdAppointmentMode;
}

async function updateAppointmentMode(id: number, data: UpdateAppointmentModeData) {
  const [updatedAppointmentMode] = await db
    .update(appointmentModeTable)
    .set({
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(appointmentModeTable.id, id),
        eq(appointmentModeTable.tenantId, data.tenantId),
        eq(appointmentModeTable.isDeleted, false)
      )
    )
    .returning(appointmentModeColumns);

  return updatedAppointmentMode;
}

async function deleteAppointmentMode(id: number, tenantId: string) {
  const deletedOn = new Date();

  const [deletedAppointmentMode] = await db
    .update(appointmentModeTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(appointmentModeTable.id, id),
        eq(appointmentModeTable.tenantId, tenantId),
        eq(appointmentModeTable.isDeleted, false)
      )
    )
    .returning(appointmentModeColumns);

  return deletedAppointmentMode;
}

async function getAppointmentModeById(id: number, tenantId: string) {
  const [appointmentMode] = await db
    .select(appointmentModeColumns)
    .from(appointmentModeTable)
    .where(
      and(
        eq(appointmentModeTable.id, id),
        eq(appointmentModeTable.tenantId, tenantId),
        eq(appointmentModeTable.isDeleted, false)
      )
    )
    .limit(1);

  return appointmentMode;
}

async function getAppointmentModes({
  tenantId,
  page = 1,
  limit = 10,
  query,
}: AppointmentModeListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(appointmentModeTable.name, `%${trimmedQuery}%`),
        ilike(appointmentModeTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(appointmentModeTable.tenantId, tenantId),
    eq(appointmentModeTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(appointmentModeColumns)
      .from(appointmentModeTable)
      .where(whereClause)
      .orderBy(asc(appointmentModeTable.name), asc(appointmentModeTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(appointmentModeTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [appointmentMode] = await db
    .select(appointmentModeColumns)
    .from(appointmentModeTable)
    .where(
      and(
        eq(appointmentModeTable.tenantId, tenantId),
        eq(appointmentModeTable.isDeleted, false),
        sql`lower(${appointmentModeTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(appointmentModeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return appointmentMode;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [appointmentMode] = await db
    .select(appointmentModeColumns)
    .from(appointmentModeTable)
    .where(
      and(
        eq(appointmentModeTable.tenantId, tenantId),
        eq(appointmentModeTable.isDeleted, false),
        sql`lower(${appointmentModeTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(appointmentModeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return appointmentMode;
}

type AppointmentModeSeed = Omit<CreateAppointmentModeData, 'tenantId'>;

async function seedDefaultAppointmentModes(tenantId: string, defaults: AppointmentModeSeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(appointmentModeTable)
    .values(
      defaults.map((appointmentMode) => ({
        tenantId,
        name: appointmentMode.name,
        code: appointmentMode.code,
        description: appointmentMode.description ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const appointmentModeRepository = {
  findActiveByName,
  findActiveByCode,
  getAppointmentModes,
  createAppointmentMode,
  updateAppointmentMode,
  deleteAppointmentMode,
  getAppointmentModeById,
  seedDefaultAppointmentModes,
};
