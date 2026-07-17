import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { admission as admissionTable } from '@/app/db/schema/admission';
import { bed as bedTable } from '@/app/db/schema/bed';
import { patient as patientTable } from '@/app/db/schema/patient';
import { room as roomTable } from '@/app/db/schema/room';
import { ward as wardTable } from '@/app/db/schema/ward';
import type { Bed, BedListParams, CreateBedData, UpdateBedData } from '../schemas/bed-schema';

const bedColumns = {
  id: bedTable.id,
  notes: bedTable.notes,
  roomId: bedTable.roomId,
  wardId: bedTable.wardId,
  status: bedTable.status,
  tenantId: bedTable.tenantId,
  bedNumber: bedTable.bedNumber,
  createdOn: bedTable.createdOn,
  modifiedOn: bedTable.modifiedOn,
  ward: {
    id: wardTable.id,
    name: wardTable.name,
    code: wardTable.code,
  },
  room: {
    id: roomTable.id,
    roomNumber: roomTable.roomNumber,
  },
};

const wardJoin = () =>
  db
    .select(bedColumns)
    .from(bedTable)
    .innerJoin(
      wardTable,
      and(eq(wardTable.id, bedTable.wardId), eq(wardTable.tenantId, bedTable.tenantId))
    )
    .leftJoin(
      roomTable,
      and(eq(roomTable.id, bedTable.roomId), eq(roomTable.tenantId, bedTable.tenantId))
    );

function bedValues(data: CreateBedData | UpdateBedData) {
  return {
    status: data.status,
    wardId: data.wardId,
    notes: data.notes ?? null,
    roomId: data.roomId ?? null,
    bedNumber: data.bedNumber,
  };
}

async function createBed(data: CreateBedData): Promise<Bed | undefined> {
  const [createdBed] = await db
    .insert(bedTable)
    .values({ tenantId: data.tenantId, ...bedValues(data) })
    .returning({ id: bedTable.id });

  return getBedById(createdBed.id, data.tenantId);
}

async function updateBed(id: number, data: UpdateBedData): Promise<Bed | undefined> {
  const [updatedBed] = await db
    .update(bedTable)
    .set({ ...bedValues(data), modifiedOn: new Date() })
    .where(
      and(eq(bedTable.id, id), eq(bedTable.tenantId, data.tenantId), eq(bedTable.isDeleted, false))
    )
    .returning({ id: bedTable.id });

  if (!updatedBed) {
    return undefined;
  }

  return getBedById(updatedBed.id, data.tenantId);
}

type DeleteBedResult =
  | { outcome: 'deleted'; data: { id: number } }
  | { outcome: 'not-found' }
  | { outcome: 'occupied'; bedNumber: string };

async function deleteBed(id: number, tenantId: string): Promise<DeleteBedResult> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: bedTable.id, status: bedTable.status, bedNumber: bedTable.bedNumber })
      .from(bedTable)
      .where(
        and(eq(bedTable.id, id), eq(bedTable.tenantId, tenantId), eq(bedTable.isDeleted, false))
      )
      .for('update')
      .limit(1);

    if (!existing) {
      return { outcome: 'not-found' as const };
    }

    if (existing.status === 'OCCUPIED') {
      return { outcome: 'occupied' as const, bedNumber: existing.bedNumber };
    }

    const deletedOn = new Date();

    const [deletedBed] = await tx
      .update(bedTable)
      .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
      .where(
        and(eq(bedTable.id, id), eq(bedTable.tenantId, tenantId), eq(bedTable.isDeleted, false))
      )
      .returning({ id: bedTable.id });

    return deletedBed
      ? { outcome: 'deleted' as const, data: deletedBed }
      : { outcome: 'not-found' as const };
  });
}

async function getBedById(id: number, tenantId: string): Promise<Bed | undefined> {
  const [bed] = await wardJoin()
    .where(and(eq(bedTable.id, id), eq(bedTable.tenantId, tenantId), eq(bedTable.isDeleted, false)))
    .limit(1);

  return bed;
}

async function getBeds({ tenantId, page = 1, limit = 10, query, wardId, status }: BedListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(ilike(bedTable.bedNumber, `%${trimmedQuery}%`), ilike(wardTable.name, `%${trimmedQuery}%`))
    : undefined;
  const whereClause = and(
    eq(bedTable.tenantId, tenantId),
    eq(bedTable.isDeleted, false),
    wardId ? eq(bedTable.wardId, wardId) : undefined,
    status ? eq(bedTable.status, status) : undefined,
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    wardJoin()
      .where(whereClause)
      .orderBy(asc(wardTable.name), asc(bedTable.bedNumber), asc(bedTable.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(bedTable)
      .innerJoin(
        wardTable,
        and(eq(wardTable.id, bedTable.wardId), eq(wardTable.tenantId, bedTable.tenantId))
      )
      .where(whereClause),
  ]);

  return { data, total };
}

export type BedBoardRow = {
  wardId: number;
  bedId: number;
  status: Bed['status'];
  wardName: string;
  wardCode: string;
  bedNumber: string;
  mrn: string | null;
  roomNumber: string | null;
  patientId: number | null;
  lastName: string | null;
  firstName: string | null;
  admissionId: number | null;
  admissionNumber: string | null;
};

async function getBedBoard(tenantId: string): Promise<BedBoardRow[]> {
  return db
    .select({
      bedId: bedTable.id,
      wardId: wardTable.id,
      status: bedTable.status,
      wardName: wardTable.name,
      wardCode: wardTable.code,
      mrn: patientTable.mrn,
      bedNumber: bedTable.bedNumber,
      roomNumber: roomTable.roomNumber,
      patientId: patientTable.id,
      lastName: patientTable.lastName,
      firstName: patientTable.firstName,
      admissionId: admissionTable.id,
      admissionNumber: admissionTable.admissionNumber,
    })
    .from(bedTable)
    .innerJoin(
      wardTable,
      and(
        eq(wardTable.id, bedTable.wardId),
        eq(wardTable.tenantId, bedTable.tenantId),
        eq(wardTable.isDeleted, false)
      )
    )
    .leftJoin(
      roomTable,
      and(eq(roomTable.id, bedTable.roomId), eq(roomTable.tenantId, bedTable.tenantId))
    )
    .leftJoin(
      admissionTable,
      and(
        eq(admissionTable.bedId, bedTable.id),
        eq(admissionTable.tenantId, bedTable.tenantId),
        eq(admissionTable.status, 'ADMITTED'),
        eq(admissionTable.isDeleted, false)
      )
    )
    .leftJoin(patientTable, eq(patientTable.id, admissionTable.patientId))
    .where(and(eq(bedTable.tenantId, tenantId), eq(bedTable.isDeleted, false)))
    .orderBy(asc(wardTable.name), asc(bedTable.bedNumber), asc(bedTable.id));
}

async function findActiveByBedNumber(
  tenantId: string,
  wardId: number,
  bedNumber: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<{ id: number; bedNumber: string } | undefined> {
  const [bed] = await db
    .select({ id: bedTable.id, bedNumber: bedTable.bedNumber })
    .from(bedTable)
    .where(
      and(
        eq(bedTable.tenantId, tenantId),
        eq(bedTable.wardId, wardId),
        eq(bedTable.isDeleted, false),
        sql`lower(${bedTable.bedNumber}) = ${bedNumber.toLowerCase()}`,
        excludeId ? ne(bedTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return bed;
}

async function countActiveBedsByWardId(tenantId: string, wardId: number): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(bedTable)
    .where(
      and(
        eq(bedTable.tenantId, tenantId),
        eq(bedTable.wardId, wardId),
        eq(bedTable.isDeleted, false)
      )
    );

  return total;
}

export const bedRepository = {
  getBeds,
  createBed,
  updateBed,
  deleteBed,
  getBedById,
  getBedBoard,
  findActiveByBedNumber,
  countActiveBedsByWardId,
};
