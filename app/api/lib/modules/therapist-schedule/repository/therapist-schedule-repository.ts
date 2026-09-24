import { and, asc, count, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { doctorRota as doctorRotaTable } from '@/app/db/schema/doctor-rota';
import {
  therapistSchedule as therapistScheduleTable,
  therapistScheduleRota as therapistScheduleRotaTable,
} from '@/app/db/schema/therapist-schedule';
import { TherapistScheduleOverlapError } from '../errors/therapist-schedule-overlap-error';
import type {
  TherapistSchedule,
  TherapistScheduleListParams,
  CreateTherapistScheduleData,
  UpdateTherapistScheduleData,
} from '../schemas/therapist-schedule-schema';
import { formatSlotDuration } from '../schemas/therapist-schedule-schema';

type TherapistScheduleRow = {
  id: number;
  tenantId: string;
  therapistId: number;
  isActive: boolean;
  createdOn: Date;
  modifiedOn: Date;
  slotToDate: string;
  slotFromDate: string;
  doctorRotaId: number | null;
  doctorRotaName: string | null;
  doctorRotaToTime: string | null;
  doctorRotaFromTime: string | null;
  slotDurationMinutes: number;
};

const scheduleColumns = {
  id: therapistScheduleTable.id,
  tenantId: therapistScheduleTable.tenantId,
  isActive: therapistScheduleTable.isActive,
  createdOn: therapistScheduleTable.createdOn,
  modifiedOn: therapistScheduleTable.modifiedOn,
  therapistId: therapistScheduleTable.therapistId,
  slotToDate: therapistScheduleTable.slotToDate,
  slotFromDate: therapistScheduleTable.slotFromDate,
  slotDurationMinutes: therapistScheduleTable.slotDurationMinutes,
};

const scheduleWithRotaColumns = {
  ...scheduleColumns,
  doctorRotaId: doctorRotaTable.id,
  doctorRotaName: doctorRotaTable.name,
  doctorRotaToTime: doctorRotaTable.toTime,
  doctorRotaFromTime: doctorRotaTable.fromTime,
};

function toSchedule(rows: TherapistScheduleRow[]): TherapistSchedule | undefined {
  const [first] = rows;
  if (!first) return undefined;

  return {
    id: first.id,
    tenantId: first.tenantId,
    isActive: first.isActive,
    createdOn: first.createdOn,
    modifiedOn: first.modifiedOn,
    therapistId: first.therapistId,
    slotToDate: first.slotToDate,
    slotFromDate: first.slotFromDate,
    slotInMinute: formatSlotDuration(first.slotDurationMinutes),
    slotDurationMinutes: first.slotDurationMinutes,
    rotaDetails: rows
      .filter((row) => row.doctorRotaId !== null)
      .map((row) => ({
        rotaId: row.doctorRotaId ?? 0,
        rotaName: row.doctorRotaName ?? '',
        toTime: row.doctorRotaToTime ?? '',
        fromTime: row.doctorRotaFromTime ?? '',
        rotaTime: `${row.doctorRotaFromTime ?? ''} - ${row.doctorRotaToTime ?? ''}`,
      })),
  };
}

function toSchedules(rows: TherapistScheduleRow[]) {
  const grouped = new Map<number, TherapistScheduleRow[]>();
  for (const row of rows) {
    const existing = grouped.get(row.id);
    if (existing) existing.push(row);
    else grouped.set(row.id, [row]);
  }
  return [...grouped.values()]
    .map(toSchedule)
    .filter((schedule): schedule is TherapistSchedule => schedule !== undefined);
}

async function lockTherapistScheduleScope(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tenantId: string,
  therapistId: number
) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${tenantId}), ${therapistId})`);
}

async function hasOverlappingScheduleInTransaction(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tenantId: string,
  therapistId: number,
  fromDate: string,
  toDate: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [overlap] = await tx
    .select({ id: therapistScheduleTable.id })
    .from(therapistScheduleTable)
    .where(
      and(
        eq(therapistScheduleTable.tenantId, tenantId),
        eq(therapistScheduleTable.therapistId, therapistId),
        eq(therapistScheduleTable.isDeleted, false),
        lte(therapistScheduleTable.slotFromDate, toDate),
        gte(therapistScheduleTable.slotToDate, fromDate),
        excludeId ? sql`${therapistScheduleTable.id} <> ${excludeId}` : undefined
      )
    )
    .limit(1);

  return overlap !== undefined;
}

async function getTherapistScheduleById(
  id: number,
  tenantId: string
): Promise<TherapistSchedule | undefined> {
  const rows = await db
    .select(scheduleWithRotaColumns)
    .from(therapistScheduleTable)
    .leftJoin(
      therapistScheduleRotaTable,
      and(
        eq(therapistScheduleRotaTable.therapistScheduleId, therapistScheduleTable.id),
        eq(therapistScheduleRotaTable.tenantId, tenantId),
        eq(therapistScheduleRotaTable.isDeleted, false)
      )
    )
    .leftJoin(
      doctorRotaTable,
      and(
        eq(doctorRotaTable.id, therapistScheduleRotaTable.doctorRotaId),
        eq(doctorRotaTable.tenantId, tenantId),
        eq(doctorRotaTable.isDeleted, false)
      )
    )
    .where(
      and(
        eq(therapistScheduleTable.id, id),
        eq(therapistScheduleTable.tenantId, tenantId),
        eq(therapistScheduleTable.isDeleted, false)
      )
    )
    .orderBy(asc(doctorRotaTable.name), asc(doctorRotaTable.id));

  return toSchedule(rows);
}

async function createTherapistSchedule(
  data: CreateTherapistScheduleData
): Promise<TherapistSchedule> {
  const scheduleId = await db.transaction(async (tx) => {
    await lockTherapistScheduleScope(tx, data.tenantId, data.therapistId);
    const hasOverlap = await hasOverlappingScheduleInTransaction(
      tx,
      data.tenantId,
      data.therapistId,
      data.slotFromDate,
      data.slotToDate
    );
    if (hasOverlap) throw new TherapistScheduleOverlapError();

    const [createdSchedule] = await tx
      .insert(therapistScheduleTable)
      .values({
        tenantId: data.tenantId,
        therapistId: data.therapistId,
        slotToDate: data.slotToDate,
        isActive: true,
        slotFromDate: data.slotFromDate,
        slotDurationMinutes: data.slotDurationMinutes,
      })
      .returning({ id: therapistScheduleTable.id });

    await tx.insert(therapistScheduleRotaTable).values(
      data.rotaIds.map((doctorRotaId) => ({
        doctorRotaId,
        tenantId: data.tenantId,
        therapistScheduleId: createdSchedule.id,
      }))
    );
    return createdSchedule.id;
  });

  const createdSchedule = await getTherapistScheduleById(scheduleId, data.tenantId);
  if (!createdSchedule) throw new Error('Created Therapist Schedule could not be read');
  return createdSchedule;
}

async function updateTherapistSchedule(
  id: number,
  data: UpdateTherapistScheduleData
): Promise<TherapistSchedule | undefined> {
  const updated = await db.transaction(async (tx) => {
    const now = new Date();
    const [existingSchedule] = await tx
      .select({
        therapistId: therapistScheduleTable.therapistId,
        slotToDate: therapistScheduleTable.slotToDate,
        slotFromDate: therapistScheduleTable.slotFromDate,
      })
      .from(therapistScheduleTable)
      .where(
        and(
          eq(therapistScheduleTable.id, id),
          eq(therapistScheduleTable.tenantId, data.tenantId),
          eq(therapistScheduleTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);
    if (!existingSchedule) return false;

    const nextTherapistId = data.therapistId ?? existingSchedule.therapistId;
    const nextSlotToDate = data.slotToDate ?? existingSchedule.slotToDate;
    const nextSlotFromDate = data.slotFromDate ?? existingSchedule.slotFromDate;
    await lockTherapistScheduleScope(tx, data.tenantId, nextTherapistId);
    const hasOverlap = await hasOverlappingScheduleInTransaction(
      tx,
      data.tenantId,
      nextTherapistId,
      nextSlotFromDate,
      nextSlotToDate,
      { excludeId: id }
    );
    if (hasOverlap) throw new TherapistScheduleOverlapError();

    const scheduleUpdate: Partial<typeof therapistScheduleTable.$inferInsert> = {
      modifiedOn: now,
    };
    if (data.therapistId !== undefined) scheduleUpdate.therapistId = data.therapistId;
    if (data.slotToDate !== undefined) scheduleUpdate.slotToDate = data.slotToDate;
    if (data.slotFromDate !== undefined) scheduleUpdate.slotFromDate = data.slotFromDate;
    if (data.slotDurationMinutes !== undefined)
      scheduleUpdate.slotDurationMinutes = data.slotDurationMinutes;

    await tx
      .update(therapistScheduleTable)
      .set(scheduleUpdate)
      .where(
        and(
          eq(therapistScheduleTable.id, id),
          eq(therapistScheduleTable.tenantId, data.tenantId),
          eq(therapistScheduleTable.isDeleted, false)
        )
      );

    if (data.rotaIds?.length) {
      if (data.rotaType === 'remove') {
        await tx
          .update(therapistScheduleRotaTable)
          .set({ isDeleted: true, deletedOn: now, modifiedOn: now })
          .where(
            and(
              eq(therapistScheduleRotaTable.tenantId, data.tenantId),
              eq(therapistScheduleRotaTable.therapistScheduleId, id),
              eq(therapistScheduleRotaTable.isDeleted, false),
              inArray(therapistScheduleRotaTable.doctorRotaId, data.rotaIds)
            )
          );
      } else {
        await tx
          .insert(therapistScheduleRotaTable)
          .values(
            data.rotaIds.map((doctorRotaId) => ({
              doctorRotaId,
              tenantId: data.tenantId,
              therapistScheduleId: id,
            }))
          )
          .onConflictDoNothing();
      }
    }
    return true;
  });

  return updated ? getTherapistScheduleById(id, data.tenantId) : undefined;
}

async function getTherapistSchedules({
  tenantId,
  page = 1,
  limit = 10,
  therapistId,
  toDate,
  fromDate,
}: TherapistScheduleListParams): Promise<{ data: TherapistSchedule[]; total: number }> {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const safeLimit = Number.isFinite(limit) ? Math.min(999, Math.max(1, Math.floor(limit))) : 10;
  const whereClause = and(
    eq(therapistScheduleTable.tenantId, tenantId),
    eq(therapistScheduleTable.isDeleted, false),
    therapistId === undefined ? undefined : eq(therapistScheduleTable.therapistId, therapistId),
    fromDate === undefined ? undefined : gte(therapistScheduleTable.slotToDate, fromDate),
    toDate === undefined ? undefined : lte(therapistScheduleTable.slotFromDate, toDate)
  );

  const [scheduleIds, [{ total }]] = await Promise.all([
    db
      .select({ id: therapistScheduleTable.id })
      .from(therapistScheduleTable)
      .where(whereClause)
      .orderBy(
        asc(therapistScheduleTable.slotFromDate),
        asc(therapistScheduleTable.therapistId),
        asc(therapistScheduleTable.id)
      )
      .limit(safeLimit)
      .offset((safePage - 1) * safeLimit),
    db.select({ total: count() }).from(therapistScheduleTable).where(whereClause),
  ]);

  if (scheduleIds.length === 0) return { data: [], total };
  const rows = await db
    .select(scheduleWithRotaColumns)
    .from(therapistScheduleTable)
    .leftJoin(
      therapistScheduleRotaTable,
      and(
        eq(therapistScheduleRotaTable.therapistScheduleId, therapistScheduleTable.id),
        eq(therapistScheduleRotaTable.tenantId, tenantId),
        eq(therapistScheduleRotaTable.isDeleted, false)
      )
    )
    .leftJoin(
      doctorRotaTable,
      and(
        eq(doctorRotaTable.id, therapistScheduleRotaTable.doctorRotaId),
        eq(doctorRotaTable.tenantId, tenantId),
        eq(doctorRotaTable.isDeleted, false)
      )
    )
    .where(
      and(
        eq(therapistScheduleTable.tenantId, tenantId),
        eq(therapistScheduleTable.isDeleted, false),
        inArray(
          therapistScheduleTable.id,
          scheduleIds.map(({ id: scheduleId }) => scheduleId)
        )
      )
    )
    .orderBy(
      asc(therapistScheduleTable.slotFromDate),
      asc(therapistScheduleTable.id),
      asc(doctorRotaTable.name),
      asc(doctorRotaTable.id)
    );

  return { data: toSchedules(rows), total };
}

async function getActiveRotaCount(tenantId: string, rotaIds: number[]) {
  const uniqueRotaIds = [...new Set(rotaIds)];
  if (uniqueRotaIds.length === 0) return 0;
  const [{ total }] = await db
    .select({ total: count() })
    .from(doctorRotaTable)
    .where(
      and(
        eq(doctorRotaTable.tenantId, tenantId),
        eq(doctorRotaTable.isDeleted, false),
        eq(doctorRotaTable.isActive, true),
        inArray(doctorRotaTable.id, uniqueRotaIds)
      )
    );
  return total;
}

export const therapistScheduleRepository = {
  getActiveRotaCount,
  getTherapistSchedules,
  createTherapistSchedule,
  updateTherapistSchedule,
  getTherapistScheduleById,
};
