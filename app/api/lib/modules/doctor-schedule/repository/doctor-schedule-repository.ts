import { and, asc, count, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { appointmentRepository } from '../../appointment/repository/appointment-repository';
import { doctorSchedule as doctorScheduleTable } from '@/app/db/schema/doctor-schedule';
import { doctorScheduleRota as doctorScheduleRotaTable } from '@/app/db/schema/doctor-schedule';
import { doctorRota as doctorRotaTable } from '@/app/db/schema/doctor-rota';
import type {
  DoctorSchedule,
  DoctorSlotDate,
  DoctorScheduleListParams,
  CreateDoctorScheduleData,
  UpdateDoctorScheduleData,
} from '../schemas/doctor-schedule-schema';
import { DoctorScheduleOverlapError } from '../errors/doctor-schedule-overlap-error';
import { formatSlotDuration, minutesFromTime } from '../schemas/doctor-schedule-schema';

type DoctorScheduleRow = {
  id: number;
  tenantId: string;
  doctorId: number;
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
  id: doctorScheduleTable.id,
  tenantId: doctorScheduleTable.tenantId,
  doctorId: doctorScheduleTable.doctorId,
  isActive: doctorScheduleTable.isActive,
  createdOn: doctorScheduleTable.createdOn,
  modifiedOn: doctorScheduleTable.modifiedOn,
  slotToDate: doctorScheduleTable.slotToDate,
  slotFromDate: doctorScheduleTable.slotFromDate,
  slotDurationMinutes: doctorScheduleTable.slotDurationMinutes,
};

const scheduleWithRotaColumns = {
  ...scheduleColumns,
  doctorRotaId: doctorRotaTable.id,
  doctorRotaName: doctorRotaTable.name,
  doctorRotaToTime: doctorRotaTable.toTime,
  doctorRotaFromTime: doctorRotaTable.fromTime,
};

function toSchedule(rows: DoctorScheduleRow[]): DoctorSchedule | undefined {
  const [first] = rows;

  if (!first) {
    return undefined;
  }

  return {
    id: first.id,
    tenantId: first.tenantId,
    doctorId: first.doctorId,
    isActive: first.isActive,
    createdOn: first.createdOn,
    modifiedOn: first.modifiedOn,
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

function toSchedules(rows: DoctorScheduleRow[]) {
  const grouped = new Map<number, DoctorScheduleRow[]>();

  for (const row of rows) {
    const existing = grouped.get(row.id);

    if (existing) {
      existing.push(row);
      continue;
    }

    grouped.set(row.id, [row]);
  }

  return [...grouped.values()]
    .map(toSchedule)
    .filter((schedule): schedule is DoctorSchedule => schedule !== undefined);
}

function generateSlotTimes(
  fromTime: string,
  toTime: string,
  duration: number,
  bookedSlotTimes: Set<string>
) {
  const start = minutesFromTime(fromTime);
  const end = minutesFromTime(toTime);
  const slots: {
    slot: number;
    slotTime: string;
    slotStatus: 'Available' | 'Booked';
  }[] = [];

  for (let current = start, slot = 1; current + duration <= end; current += duration, slot += 1) {
    const slotTime = formatSlotDuration(current);
    slots.push({
      slot,
      slotTime,
      slotStatus: bookedSlotTimes.has(slotTime) ? 'Booked' : 'Available',
    });
  }

  return slots;
}

async function lockDoctorScheduleScope(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tenantId: string,
  doctorId: number
) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${tenantId}), ${doctorId})`);
}

async function hasOverlappingScheduleInTransaction(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tenantId: string,
  doctorId: number,
  fromDate: string,
  toDate: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [overlap] = await tx
    .select({ id: doctorScheduleTable.id })
    .from(doctorScheduleTable)
    .where(
      and(
        eq(doctorScheduleTable.tenantId, tenantId),
        eq(doctorScheduleTable.doctorId, doctorId),
        eq(doctorScheduleTable.isDeleted, false),
        lte(doctorScheduleTable.slotFromDate, toDate),
        gte(doctorScheduleTable.slotToDate, fromDate),
        excludeId ? sql`${doctorScheduleTable.id} <> ${excludeId}` : undefined
      )
    )
    .limit(1);

  return overlap !== undefined;
}

async function getDoctorScheduleById(
  id: number,
  tenantId: string
): Promise<DoctorSchedule | undefined> {
  const rows = await db
    .select(scheduleWithRotaColumns)
    .from(doctorScheduleTable)
    .leftJoin(
      doctorScheduleRotaTable,
      and(
        eq(doctorScheduleRotaTable.doctorScheduleId, doctorScheduleTable.id),
        eq(doctorScheduleRotaTable.tenantId, tenantId),
        eq(doctorScheduleRotaTable.isDeleted, false)
      )
    )
    .leftJoin(
      doctorRotaTable,
      and(
        eq(doctorRotaTable.id, doctorScheduleRotaTable.doctorRotaId),
        eq(doctorRotaTable.tenantId, tenantId),
        eq(doctorRotaTable.isDeleted, false)
      )
    )
    .where(
      and(
        eq(doctorScheduleTable.id, id),
        eq(doctorScheduleTable.tenantId, tenantId),
        eq(doctorScheduleTable.isDeleted, false)
      )
    )
    .orderBy(asc(doctorRotaTable.name), asc(doctorRotaTable.id));

  return toSchedule(rows);
}

async function createDoctorSchedule(data: CreateDoctorScheduleData): Promise<DoctorSchedule> {
  const scheduleId = await db.transaction(async (tx) => {
    await lockDoctorScheduleScope(tx, data.tenantId, data.doctorId);

    const hasOverlap = await hasOverlappingScheduleInTransaction(
      tx,
      data.tenantId,
      data.doctorId,
      data.slotFromDate,
      data.slotToDate
    );

    if (hasOverlap) {
      throw new DoctorScheduleOverlapError();
    }

    const [createdSchedule] = await tx
      .insert(doctorScheduleTable)
      .values({
        tenantId: data.tenantId,
        doctorId: data.doctorId,
        slotToDate: data.slotToDate,
        isActive: true,
        slotFromDate: data.slotFromDate,
        slotDurationMinutes: data.slotDurationMinutes,
      })
      .returning({ id: doctorScheduleTable.id });

    if (data.rotaIds.length > 0) {
      await tx.insert(doctorScheduleRotaTable).values(
        data.rotaIds.map((doctorRotaId) => ({
          doctorRotaId,
          tenantId: data.tenantId,
          doctorScheduleId: createdSchedule.id,
        }))
      );
    }

    return createdSchedule.id;
  });

  const createdSchedule = await getDoctorScheduleById(scheduleId, data.tenantId);

  if (!createdSchedule) {
    throw new Error('Created Doctor Schedule could not be read');
  }

  return createdSchedule;
}

async function updateDoctorSchedule(
  id: number,
  data: UpdateDoctorScheduleData
): Promise<DoctorSchedule | undefined> {
  const updated = await db.transaction(async (tx) => {
    const now = new Date();

    const [existingSchedule] = await tx
      .select({
        doctorId: doctorScheduleTable.doctorId,
        slotToDate: doctorScheduleTable.slotToDate,
        slotFromDate: doctorScheduleTable.slotFromDate,
      })
      .from(doctorScheduleTable)
      .where(
        and(
          eq(doctorScheduleTable.id, id),
          eq(doctorScheduleTable.tenantId, data.tenantId),
          eq(doctorScheduleTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!existingSchedule) {
      return false;
    }

    const nextDoctorId = data.doctorId ?? existingSchedule.doctorId;
    const nextSlotToDate = data.slotToDate ?? existingSchedule.slotToDate;
    const nextSlotFromDate = data.slotFromDate ?? existingSchedule.slotFromDate;

    await lockDoctorScheduleScope(tx, data.tenantId, nextDoctorId);

    const hasOverlap = await hasOverlappingScheduleInTransaction(
      tx,
      data.tenantId,
      nextDoctorId,
      nextSlotFromDate,
      nextSlotToDate,
      { excludeId: id }
    );

    if (hasOverlap) {
      throw new DoctorScheduleOverlapError();
    }

    const scheduleUpdate: Partial<typeof doctorScheduleTable.$inferInsert> = { modifiedOn: now };

    if (data.doctorId !== undefined) {
      scheduleUpdate.doctorId = data.doctorId;
    }

    if (data.slotToDate !== undefined) {
      scheduleUpdate.slotToDate = data.slotToDate;
    }

    if (data.slotFromDate !== undefined) {
      scheduleUpdate.slotFromDate = data.slotFromDate;
    }

    if (data.slotDurationMinutes !== undefined) {
      scheduleUpdate.slotDurationMinutes = data.slotDurationMinutes;
    }

    await tx
      .update(doctorScheduleTable)
      .set(scheduleUpdate)
      .where(
        and(
          eq(doctorScheduleTable.id, id),
          eq(doctorScheduleTable.tenantId, data.tenantId),
          eq(doctorScheduleTable.isDeleted, false)
        )
      );

    if (data.rotaIds && data.rotaIds.length > 0) {
      if (data.rotaType === 'remove') {
        await tx
          .update(doctorScheduleRotaTable)
          .set({
            isDeleted: true,
            deletedOn: now,
            modifiedOn: now,
          })
          .where(
            and(
              eq(doctorScheduleRotaTable.tenantId, data.tenantId),
              eq(doctorScheduleRotaTable.doctorScheduleId, id),
              eq(doctorScheduleRotaTable.isDeleted, false),
              inArray(doctorScheduleRotaTable.doctorRotaId, data.rotaIds)
            )
          );
      } else {
        await tx
          .insert(doctorScheduleRotaTable)
          .values(
            data.rotaIds.map((doctorRotaId) => ({
              doctorRotaId,
              tenantId: data.tenantId,
              doctorScheduleId: id,
            }))
          )
          .onConflictDoNothing();
      }
    }

    return true;
  });

  return updated ? getDoctorScheduleById(id, data.tenantId) : undefined;
}

async function deleteDoctorSchedule(
  id: number,
  tenantId: string
): Promise<DoctorSchedule | undefined> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select(scheduleWithRotaColumns)
      .from(doctorScheduleTable)
      .leftJoin(
        doctorScheduleRotaTable,
        and(
          eq(doctorScheduleRotaTable.doctorScheduleId, doctorScheduleTable.id),
          eq(doctorScheduleRotaTable.tenantId, tenantId),
          eq(doctorScheduleRotaTable.isDeleted, false)
        )
      )
      .leftJoin(
        doctorRotaTable,
        and(
          eq(doctorRotaTable.id, doctorScheduleRotaTable.doctorRotaId),
          eq(doctorRotaTable.tenantId, tenantId),
          eq(doctorRotaTable.isDeleted, false)
        )
      )
      .where(
        and(
          eq(doctorScheduleTable.id, id),
          eq(doctorScheduleTable.tenantId, tenantId),
          eq(doctorScheduleTable.isDeleted, false)
        )
      )
      .orderBy(asc(doctorRotaTable.name), asc(doctorRotaTable.id));

    const existingSchedule = toSchedule(rows);

    if (!existingSchedule) {
      return undefined;
    }

    const deletedOn = new Date();

    await tx
      .update(doctorScheduleTable)
      .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
      .where(
        and(
          eq(doctorScheduleTable.id, id),
          eq(doctorScheduleTable.tenantId, tenantId),
          eq(doctorScheduleTable.isDeleted, false)
        )
      );

    await tx
      .update(doctorScheduleRotaTable)
      .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
      .where(
        and(
          eq(doctorScheduleRotaTable.tenantId, tenantId),
          eq(doctorScheduleRotaTable.doctorScheduleId, id),
          eq(doctorScheduleRotaTable.isDeleted, false)
        )
      );

    return existingSchedule;
  });
}

async function getDoctorSchedules({
  tenantId,
  page = 1,
  limit = 10,
  doctorId,
  toDate,
  fromDate,
}: DoctorScheduleListParams): Promise<{ data: DoctorSchedule[]; total: number }> {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const safeLimit = Number.isFinite(limit) ? Math.min(999, Math.max(1, Math.floor(limit))) : 10;
  const offset = (safePage - 1) * safeLimit;
  const whereClause = and(
    eq(doctorScheduleTable.tenantId, tenantId),
    eq(doctorScheduleTable.isDeleted, false),
    doctorId === undefined ? undefined : eq(doctorScheduleTable.doctorId, doctorId),
    fromDate === undefined ? undefined : gte(doctorScheduleTable.slotToDate, fromDate),
    toDate === undefined ? undefined : lte(doctorScheduleTable.slotFromDate, toDate)
  );

  const [scheduleIds, [{ total }]] = await Promise.all([
    db
      .select({ id: doctorScheduleTable.id })
      .from(doctorScheduleTable)
      .where(whereClause)
      .orderBy(
        asc(doctorScheduleTable.slotFromDate),
        asc(doctorScheduleTable.doctorId),
        asc(doctorScheduleTable.id)
      )
      .limit(safeLimit)
      .offset(offset),
    db.select({ total: count() }).from(doctorScheduleTable).where(whereClause),
  ]);

  if (scheduleIds.length === 0) {
    return { data: [], total };
  }

  const rows = await db
    .select(scheduleWithRotaColumns)
    .from(doctorScheduleTable)
    .leftJoin(
      doctorScheduleRotaTable,
      and(
        eq(doctorScheduleRotaTable.doctorScheduleId, doctorScheduleTable.id),
        eq(doctorScheduleRotaTable.tenantId, tenantId),
        eq(doctorScheduleRotaTable.isDeleted, false)
      )
    )
    .leftJoin(
      doctorRotaTable,
      and(
        eq(doctorRotaTable.id, doctorScheduleRotaTable.doctorRotaId),
        eq(doctorRotaTable.tenantId, tenantId),
        eq(doctorRotaTable.isDeleted, false)
      )
    )
    .where(
      and(
        eq(doctorScheduleTable.tenantId, tenantId),
        eq(doctorScheduleTable.isDeleted, false),
        inArray(
          doctorScheduleTable.id,
          scheduleIds.map((schedule) => schedule.id)
        )
      )
    )
    .orderBy(
      asc(doctorScheduleTable.slotFromDate),
      asc(doctorScheduleTable.id),
      asc(doctorRotaTable.name),
      asc(doctorRotaTable.id)
    );

  return { data: toSchedules(rows), total };
}

async function getDoctorSlots(
  tenantId: string,
  doctorId: number,
  slotDate: string
): Promise<DoctorSlotDate[]> {
  const { data: schedules } = await getDoctorSchedules({
    limit: 999,
    tenantId,
    doctorId,
    toDate: slotDate,
    fromDate: slotDate,
  });
  const reserved = await appointmentRepository.getReservedSlotTimes(tenantId, doctorId, slotDate);
  const bookedSlotTimes = new Set(reserved.map((reservation) => reservation.slotTime));

  const rotas = schedules.flatMap((schedule) =>
    schedule.rotaDetails.map((rota) => ({
      rotaName: rota.rotaName,
      duration: schedule.slotDurationMinutes,
      doctorRotaId: rota.rotaId,
      slots: generateSlotTimes(
        rota.fromTime,
        rota.toTime,
        schedule.slotDurationMinutes,
        bookedSlotTimes
      ),
    }))
  );

  return [
    {
      rotas,
      slotDate,
      status: 'Available',
    },
  ];
}

async function getActiveRotaCount(tenantId: string, rotaIds: number[]) {
  const uniqueRotaIds = [...new Set(rotaIds)];

  if (uniqueRotaIds.length === 0) {
    return 0;
  }

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

async function hasOverlappingSchedule(
  tenantId: string,
  doctorId: number,
  fromDate: string,
  toDate: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [overlap] = await db
    .select({ id: doctorScheduleTable.id })
    .from(doctorScheduleTable)
    .where(
      and(
        eq(doctorScheduleTable.tenantId, tenantId),
        eq(doctorScheduleTable.doctorId, doctorId),
        eq(doctorScheduleTable.isDeleted, false),
        lte(doctorScheduleTable.slotFromDate, toDate),
        gte(doctorScheduleTable.slotToDate, fromDate),
        excludeId ? sql`${doctorScheduleTable.id} <> ${excludeId}` : undefined
      )
    )
    .limit(1);

  return overlap !== undefined;
}

export const doctorScheduleRepository = {
  getDoctorSlots,
  getActiveRotaCount,
  getDoctorSchedules,
  createDoctorSchedule,
  updateDoctorSchedule,
  deleteDoctorSchedule,
  getDoctorScheduleById,
  hasOverlappingSchedule,
};
