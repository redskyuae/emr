import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { room as roomTable } from '@/app/db/schema/room';
import { roomType as roomTypeTable } from '@/app/db/schema/room-type';
import type {
  RoomType,
  CreateRoomTypeData,
  RoomTypeListParams,
  UpdateRoomTypeData,
} from '../schemas/room-type-schema';

const roomTypeColumns = {
  id: roomTypeTable.id,
  name: roomTypeTable.name,
  code: roomTypeTable.code,
  color: roomTypeTable.color,
  tenantId: roomTypeTable.tenantId,
  dailyRate: roomTypeTable.dailyRate,
  createdOn: roomTypeTable.createdOn,
  modifiedOn: roomTypeTable.modifiedOn,
  description: roomTypeTable.description,
};

async function createRoomType(data: CreateRoomTypeData) {
  const [createdRoomType] = await db
    .insert(roomTypeTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      color: data.color,
      dailyRate: data.dailyRate ?? null,
      description: data.description ?? null,
    })
    .returning(roomTypeColumns);

  return createdRoomType;
}

async function updateRoomType(id: number, data: UpdateRoomTypeData): Promise<RoomType | undefined> {
  const [updatedRoomType] = await db
    .update(roomTypeTable)
    .set({
      name: data.name,
      code: data.code,
      color: data.color,
      dailyRate: data.dailyRate ?? null,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(roomTypeTable.id, id),
        eq(roomTypeTable.tenantId, data.tenantId),
        eq(roomTypeTable.isDeleted, false)
      )
    )
    .returning(roomTypeColumns);

  return updatedRoomType;
}

type DeleteRoomTypeResult =
  { outcome: 'deleted'; data: RoomType } | { outcome: 'not-found' } | { outcome: 'in-use' };

async function deleteRoomType(id: number, tenantId: string): Promise<DeleteRoomTypeResult> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: roomTypeTable.id })
      .from(roomTypeTable)
      .where(
        and(
          eq(roomTypeTable.id, id),
          eq(roomTypeTable.tenantId, tenantId),
          eq(roomTypeTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!existing) {
      return { outcome: 'not-found' as const };
    }

    const [usage] = await tx
      .select({ id: roomTable.id })
      .from(roomTable)
      .where(
        and(
          eq(roomTable.roomTypeId, id),
          eq(roomTable.tenantId, tenantId),
          eq(roomTable.isDeleted, false)
        )
      )
      .limit(1);

    if (usage) {
      return { outcome: 'in-use' as const };
    }

    const deletedOn = new Date();

    const [deletedRoomType] = await tx
      .update(roomTypeTable)
      .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
      .where(
        and(
          eq(roomTypeTable.id, id),
          eq(roomTypeTable.tenantId, tenantId),
          eq(roomTypeTable.isDeleted, false)
        )
      )
      .returning(roomTypeColumns);

    return deletedRoomType
      ? { outcome: 'deleted' as const, data: deletedRoomType }
      : { outcome: 'not-found' as const };
  });
}

async function getRoomTypeById(id: number, tenantId: string): Promise<RoomType | undefined> {
  const [roomType] = await db
    .select(roomTypeColumns)
    .from(roomTypeTable)
    .where(
      and(
        eq(roomTypeTable.id, id),
        eq(roomTypeTable.tenantId, tenantId),
        eq(roomTypeTable.isDeleted, false)
      )
    )
    .limit(1);

  return roomType;
}

async function getRoomTypes({ tenantId, page = 1, limit = 10, query }: RoomTypeListParams) {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.max(1, Math.floor(limit));
  const offset = (safePage - 1) * safeLimit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(roomTypeTable.name, `%${trimmedQuery}%`),
        ilike(roomTypeTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(roomTypeTable.tenantId, tenantId),
    eq(roomTypeTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(roomTypeColumns)
      .from(roomTypeTable)
      .where(whereClause)
      .orderBy(asc(roomTypeTable.name), asc(roomTypeTable.id))
      .limit(safeLimit)
      .offset(offset),
    db.select({ total: count() }).from(roomTypeTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<RoomType | undefined> {
  const [roomType] = await db
    .select(roomTypeColumns)
    .from(roomTypeTable)
    .where(
      and(
        eq(roomTypeTable.tenantId, tenantId),
        eq(roomTypeTable.isDeleted, false),
        sql`lower(${roomTypeTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(roomTypeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return roomType;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<RoomType | undefined> {
  const [roomType] = await db
    .select(roomTypeColumns)
    .from(roomTypeTable)
    .where(
      and(
        eq(roomTypeTable.tenantId, tenantId),
        eq(roomTypeTable.isDeleted, false),
        sql`lower(${roomTypeTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(roomTypeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return roomType;
}

export const roomTypeRepository = {
  getRoomTypes,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  findActiveByName,
  findActiveByCode,
  getRoomTypeById,
};
