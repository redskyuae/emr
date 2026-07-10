import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { doctorRota as doctorRotaTable } from '@/app/db/schema/doctor-rota';
import type {
  DoctorRota,
  DoctorRotaListParams,
  CreateDoctorRotaData,
  UpdateDoctorRotaData,
} from '../schemas/doctor-rota-schema';

const doctorRotaColumns = {
  id: doctorRotaTable.id,
  name: doctorRotaTable.name,
  toTime: doctorRotaTable.toTime,
  tenantId: doctorRotaTable.tenantId,
  fromTime: doctorRotaTable.fromTime,
  isActive: doctorRotaTable.isActive,
  createdOn: doctorRotaTable.createdOn,
  modifiedOn: doctorRotaTable.modifiedOn,
};

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

async function createDoctorRota(data: CreateDoctorRotaData) {
  const [createdDoctorRota] = await db
    .insert(doctorRotaTable)
    .values({
      name: data.name,
      toTime: data.toTime,
      tenantId: data.tenantId,
      fromTime: data.fromTime,
      isActive: true,
    })
    .returning(doctorRotaColumns);

  return createdDoctorRota;
}

async function updateDoctorRota(
  id: number,
  data: UpdateDoctorRotaData
): Promise<DoctorRota | undefined> {
  const [updatedDoctorRota] = await db
    .update(doctorRotaTable)
    .set({
      name: data.name,
      toTime: data.toTime,
      fromTime: data.fromTime,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(doctorRotaTable.id, id),
        eq(doctorRotaTable.tenantId, data.tenantId),
        eq(doctorRotaTable.isDeleted, false)
      )
    )
    .returning(doctorRotaColumns);

  return updatedDoctorRota;
}

async function deleteDoctorRota(id: number, tenantId: string): Promise<DoctorRota | undefined> {
  const deletedOn = new Date();

  const [deletedDoctorRota] = await db
    .update(doctorRotaTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(doctorRotaTable.id, id),
        eq(doctorRotaTable.tenantId, tenantId),
        eq(doctorRotaTable.isDeleted, false)
      )
    )
    .returning(doctorRotaColumns);

  return deletedDoctorRota;
}

async function getDoctorRotaById(id: number, tenantId: string): Promise<DoctorRota | undefined> {
  const [doctorRota] = await db
    .select(doctorRotaColumns)
    .from(doctorRotaTable)
    .where(
      and(
        eq(doctorRotaTable.id, id),
        eq(doctorRotaTable.tenantId, tenantId),
        eq(doctorRotaTable.isDeleted, false)
      )
    )
    .limit(1);

  return doctorRota;
}

async function getDoctorRotas({ tenantId, page = 1, limit = 10, query }: DoctorRotaListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const escapedQuery = trimmedQuery ? escapeLikePattern(trimmedQuery) : undefined;
  const searchPattern = escapedQuery ? `%${escapedQuery}%` : undefined;
  const searchCondition = searchPattern
    ? or(
        ilike(doctorRotaTable.name, searchPattern),
        ilike(doctorRotaTable.fromTime, searchPattern),
        ilike(doctorRotaTable.toTime, searchPattern)
      )
    : undefined;
  const whereClause = and(
    eq(doctorRotaTable.tenantId, tenantId),
    eq(doctorRotaTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(doctorRotaColumns)
      .from(doctorRotaTable)
      .where(whereClause)
      .orderBy(asc(doctorRotaTable.name), asc(doctorRotaTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(doctorRotaTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<DoctorRota | undefined> {
  const [doctorRota] = await db
    .select(doctorRotaColumns)
    .from(doctorRotaTable)
    .where(
      and(
        eq(doctorRotaTable.tenantId, tenantId),
        eq(doctorRotaTable.isDeleted, false),
        sql`lower(${doctorRotaTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(doctorRotaTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return doctorRota;
}

export const doctorRotaRepository = {
  findActiveByName,
  getDoctorRotas,
  createDoctorRota,
  updateDoctorRota,
  deleteDoctorRota,
  getDoctorRotaById,
};
