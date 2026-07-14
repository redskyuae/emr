import { and, asc, count, eq, ilike, ne, or, sql, sum } from 'drizzle-orm';

import { db } from '@/app/db';
import { room as roomTable } from '@/app/db/schema/room';
import { roomType as roomTypeTable } from '@/app/db/schema/room-type';
import type {
  Room,
  RoomSummary,
  CreateRoomData,
  RoomListParams,
  UpdateRoomData,
} from '../schemas/room-schema';

const roomColumns = {
  id: roomTable.id,
  wing: roomTable.wing,
  floor: roomTable.floor,
  status: roomTable.status,
  bedCount: roomTable.bedCount,
  tenantId: roomTable.tenantId,
  createdOn: roomTable.createdOn,
  modifiedOn: roomTable.modifiedOn,
  roomTypeId: roomTable.roomTypeId,
  roomNumber: roomTable.roomNumber,
  notes: roomTable.notes,
  facility: roomTable.facility,
  department: roomTable.department,
  roomType: {
    id: roomTypeTable.id,
    name: roomTypeTable.name,
    code: roomTypeTable.code,
    color: roomTypeTable.color,
    dailyRate: roomTypeTable.dailyRate,
  },
};

const roomTypeJoin = () =>
  db
    .select(roomColumns)
    .from(roomTable)
    .innerJoin(
      roomTypeTable,
      and(
        eq(roomTypeTable.id, roomTable.roomTypeId),
        eq(roomTypeTable.tenantId, roomTable.tenantId),
        eq(roomTypeTable.isDeleted, false)
      )
    );

function roomValues(data: CreateRoomData | UpdateRoomData) {
  return {
    status: data.status,
    tenantId: data.tenantId,
    bedCount: data.bedCount,
    wing: data.wing ?? null,
    floor: data.floor ?? null,
    notes: data.notes ?? null,
    roomTypeId: data.roomTypeId,
    roomNumber: data.roomNumber,
    facility: data.facility ?? null,
    department: data.department ?? null,
  };
}

async function createRoom(data: CreateRoomData): Promise<Room | undefined> {
  const [createdRoom] = await db
    .insert(roomTable)
    .values(roomValues(data))
    .returning({ id: roomTable.id });

  return getRoomById(createdRoom.id, data.tenantId);
}

async function updateRoom(id: number, data: UpdateRoomData): Promise<Room | undefined> {
  const [updatedRoom] = await db
    .update(roomTable)
    .set({ ...roomValues(data), modifiedOn: new Date() })
    .where(
      and(
        eq(roomTable.id, id),
        eq(roomTable.tenantId, data.tenantId),
        eq(roomTable.isDeleted, false)
      )
    )
    .returning({ id: roomTable.id });

  if (!updatedRoom) {
    return undefined;
  }

  return getRoomById(updatedRoom.id, data.tenantId);
}

type DeleteRoomResult =
  { outcome: 'deleted'; data: { id: number } } | { outcome: 'not-found' } | { outcome: 'occupied' };

async function deleteRoom(id: number, tenantId: string): Promise<DeleteRoomResult> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: roomTable.id, status: roomTable.status })
      .from(roomTable)
      .where(
        and(eq(roomTable.id, id), eq(roomTable.tenantId, tenantId), eq(roomTable.isDeleted, false))
      )
      .for('update')
      .limit(1);

    if (!existing) {
      return { outcome: 'not-found' as const };
    }

    if (existing.status === 'OCCUPIED') {
      return { outcome: 'occupied' as const };
    }

    const deletedOn = new Date();

    const [deletedRoom] = await tx
      .update(roomTable)
      .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
      .where(
        and(eq(roomTable.id, id), eq(roomTable.tenantId, tenantId), eq(roomTable.isDeleted, false))
      )
      .returning({ id: roomTable.id });

    return deletedRoom
      ? { outcome: 'deleted' as const, data: deletedRoom }
      : { outcome: 'not-found' as const };
  });
}

async function getRoomById(id: number, tenantId: string): Promise<Room | undefined> {
  const [room] = await roomTypeJoin()
    .where(
      and(eq(roomTable.id, id), eq(roomTable.tenantId, tenantId), eq(roomTable.isDeleted, false))
    )
    .limit(1);

  return room;
}

async function getRooms({
  tenantId,
  page = 1,
  limit = 10,
  query,
  roomTypeId,
  status,
}: RoomListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(roomTable.roomNumber, `%${trimmedQuery}%`),
        ilike(roomTable.wing, `%${trimmedQuery}%`),
        ilike(roomTable.floor, `%${trimmedQuery}%`),
        ilike(roomTable.facility, `%${trimmedQuery}%`),
        ilike(roomTable.department, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(roomTable.tenantId, tenantId),
    eq(roomTable.isDeleted, false),
    roomTypeId ? eq(roomTable.roomTypeId, roomTypeId) : undefined,
    status ? eq(roomTable.status, status) : undefined,
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    roomTypeJoin()
      .where(whereClause)
      .orderBy(asc(roomTable.roomNumber), asc(roomTable.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(roomTable)
      .innerJoin(
        roomTypeTable,
        and(
          eq(roomTypeTable.id, roomTable.roomTypeId),
          eq(roomTypeTable.tenantId, roomTable.tenantId),
          eq(roomTypeTable.isDeleted, false)
        )
      )
      .where(whereClause),
  ]);

  return { data, total };
}

async function getRoomSummary(tenantId: string): Promise<RoomSummary> {
  const activeRooms = and(eq(roomTable.tenantId, tenantId), eq(roomTable.isDeleted, false));

  const [[totals], byStatus, byType] = await Promise.all([
    db
      .select({
        totalRooms: count(),
        totalBeds: sql<number>`coalesce(${sum(roomTable.bedCount)}, 0)`.mapWith(Number),
        availableRooms:
          sql<number>`count(*) filter (where ${roomTable.status} = 'AVAILABLE')`.mapWith(Number),
        occupiedRooms:
          sql<number>`count(*) filter (where ${roomTable.status} = 'OCCUPIED')`.mapWith(Number),
      })
      .from(roomTable)
      .where(activeRooms),
    db
      .select({ status: roomTable.status, count: count() })
      .from(roomTable)
      .where(activeRooms)
      .groupBy(roomTable.status)
      .orderBy(asc(roomTable.status)),
    db
      .select({
        name: roomTypeTable.name,
        color: roomTypeTable.color,
        count: count(roomTable.id),
        roomTypeId: roomTypeTable.id,
      })
      .from(roomTypeTable)
      .leftJoin(
        roomTable,
        and(
          eq(roomTable.roomTypeId, roomTypeTable.id),
          eq(roomTable.tenantId, roomTypeTable.tenantId),
          eq(roomTable.isDeleted, false)
        )
      )
      .where(and(eq(roomTypeTable.tenantId, tenantId), eq(roomTypeTable.isDeleted, false)))
      .groupBy(roomTypeTable.id, roomTypeTable.name, roomTypeTable.color)
      .orderBy(asc(roomTypeTable.name)),
  ]);

  const occupancyRate =
    totals.totalRooms > 0 ? Math.round((totals.occupiedRooms / totals.totalRooms) * 1000) / 10 : 0;

  return {
    byType,
    byStatus,
    occupancyRate,
    totalBeds: totals.totalBeds,
    totalRooms: totals.totalRooms,
    availableRooms: totals.availableRooms,
  };
}

async function findActiveByRoomNumber(
  tenantId: string,
  roomNumber: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<{ id: number; roomNumber: string } | undefined> {
  const [room] = await db
    .select({ id: roomTable.id, roomNumber: roomTable.roomNumber })
    .from(roomTable)
    .where(
      and(
        eq(roomTable.tenantId, tenantId),
        eq(roomTable.isDeleted, false),
        sql`lower(${roomTable.roomNumber}) = ${roomNumber.toLowerCase()}`,
        excludeId ? ne(roomTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return room;
}

export const roomRepository = {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomById,
  getRoomSummary,
  findActiveByRoomNumber,
};
