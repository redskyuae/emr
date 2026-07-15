import { beforeEach, describe, expect, it } from 'vitest';

import { roomTypeRepository } from '../../room-type/repository/room-type-repository';
import type { RoomStatus } from '../schemas/room-schema';
import { roomRepository } from './room-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

let roomTypeA: { id: number };
let roomTypeB: { id: number };

const createRoomType = (tenantId: string, name: string, code: string) =>
  roomTypeRepository.createRoomType({
    tenantId,
    name,
    code,
    color: '#2563EB',
    dailyRate: 4500,
    description: undefined,
  });

const createRoom = (
  tenantId: string,
  roomNumber: string,
  roomTypeId: number,
  overrides: { status?: RoomStatus; bedCount?: number; wing?: string } = {}
) =>
  roomRepository.createRoom({
    tenantId,
    roomNumber,
    roomTypeId,
    status: overrides.status ?? 'AVAILABLE',
    bedCount: overrides.bedCount ?? 1,
    wing: overrides.wing,
  });

describe('Room repository', () => {
  beforeEach(async () => {
    roomTypeA = await createRoomType(tenantA, 'Private Room', 'PVT');
    roomTypeB = await createRoomType(tenantB, 'Private Room', 'PVT');
  });

  it('should create a Room with its Room Type resolved', async () => {
    const created = await createRoom(tenantA, '101', roomTypeA.id, { bedCount: 2 });

    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      roomNumber: '101',
      status: 'AVAILABLE',
      bedCount: 2,
      roomType: { id: roomTypeA.id, name: 'Private Room', code: 'PVT', dailyRate: 4500 },
    });
  });

  it('should read a Room by id within the same tenant only', async () => {
    const created = await createRoom(tenantA, '102', roomTypeA.id);

    await expect(roomRepository.getRoomById(created!.id, tenantA)).resolves.toMatchObject({
      id: created!.id,
    });
    await expect(roomRepository.getRoomById(created!.id, tenantB)).resolves.toBeUndefined();
  });

  it('should list only Rooms belonging to the requested tenant', async () => {
    await createRoom(tenantA, '103', roomTypeA.id);
    await createRoom(tenantB, '103', roomTypeB.id);

    const result = await roomRepository.getRooms({ tenantId: tenantA });

    expect(result.total).toBe(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should exclude soft-deleted Rooms from reads', async () => {
    const deleted = await createRoom(tenantA, '104', roomTypeA.id);
    await createRoom(tenantA, '105', roomTypeA.id);

    const deleteResult = await roomRepository.deleteRoom(deleted!.id, tenantA);
    expect(deleteResult.outcome).toBe('deleted');

    const result = await roomRepository.getRooms({ tenantId: tenantA });
    expect(result.data.map((room) => room.roomNumber)).toEqual(['105']);
    await expect(roomRepository.getRoomById(deleted!.id, tenantA)).resolves.toBeUndefined();
  });

  it('should refuse to delete an occupied Room', async () => {
    const occupied = await createRoom(tenantA, '106', roomTypeA.id, { status: 'OCCUPIED' });

    await expect(roomRepository.deleteRoom(occupied!.id, tenantA)).resolves.toEqual({
      outcome: 'occupied',
    });
    await expect(roomRepository.getRoomById(occupied!.id, tenantA)).resolves.toBeDefined();
  });

  it('should not delete a Room from another tenant', async () => {
    const created = await createRoom(tenantA, '107', roomTypeA.id);

    await expect(roomRepository.deleteRoom(created!.id, tenantB)).resolves.toEqual({
      outcome: 'not-found',
    });
  });

  it('should update only an active Room in the requested tenant', async () => {
    const created = await createRoom(tenantA, '108', roomTypeA.id);

    await expect(
      roomRepository.updateRoom(created!.id, {
        tenantId: tenantA,
        roomNumber: '108-B',
        roomTypeId: roomTypeA.id,
        status: 'MAINTENANCE',
        bedCount: 4,
        floor: '2',
        wing: 'East',
      })
    ).resolves.toMatchObject({
      roomNumber: '108-B',
      status: 'MAINTENANCE',
      bedCount: 4,
      floor: '2',
      wing: 'East',
    });

    await roomRepository.deleteRoom(created!.id, tenantA);

    await expect(
      roomRepository.updateRoom(created!.id, {
        tenantId: tenantA,
        roomNumber: '108-C',
        roomTypeId: roomTypeA.id,
        status: 'AVAILABLE',
        bedCount: 1,
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive room number uniqueness within a tenant', async () => {
    await createRoom(tenantA, '109-a', roomTypeA.id);

    await expect(createRoom(tenantA, '109-A', roomTypeA.id)).rejects.toMatchObject({
      cause: expect.objectContaining({ code: '23505' }),
    });
  });

  it('should allow the same room number in a different tenant', async () => {
    await createRoom(tenantA, '110', roomTypeA.id);

    await expect(createRoom(tenantB, '110', roomTypeB.id)).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should free a room number for reuse once the holding Room is soft-deleted', async () => {
    const created = await createRoom(tenantA, '111', roomTypeA.id);
    await roomRepository.deleteRoom(created!.id, tenantA);

    await expect(createRoom(tenantA, '111', roomTypeA.id)).resolves.toMatchObject({
      roomNumber: '111',
    });
  });

  it('should filter Rooms by status and Room Type', async () => {
    const otherType = await createRoomType(tenantA, 'General Ward', 'GEN');
    await createRoom(tenantA, '112', roomTypeA.id, { status: 'OCCUPIED' });
    await createRoom(tenantA, '113', roomTypeA.id, { status: 'AVAILABLE' });
    await createRoom(tenantA, '114', otherType.id, { status: 'OCCUPIED' });

    const occupied = await roomRepository.getRooms({ tenantId: tenantA, status: 'OCCUPIED' });
    expect(occupied.data.map((room) => room.roomNumber)).toEqual(['112', '114']);

    const byType = await roomRepository.getRooms({ tenantId: tenantA, roomTypeId: otherType.id });
    expect(byType.data.map((room) => room.roomNumber)).toEqual(['114']);
  });

  it('should search Rooms by number and wing, and paginate results', async () => {
    await createRoom(tenantA, '201', roomTypeA.id, { wing: 'East' });
    await createRoom(tenantA, '202', roomTypeA.id, { wing: 'West' });
    await createRoom(tenantA, '203', roomTypeA.id, { wing: 'East' });

    const searched = await roomRepository.getRooms({ tenantId: tenantA, query: 'east' });
    expect(searched.total).toBe(2);

    const firstPage = await roomRepository.getRooms({ tenantId: tenantA, page: 1, limit: 2 });
    expect(firstPage.total).toBe(3);
    expect(firstPage.data).toHaveLength(2);

    const secondPage = await roomRepository.getRooms({ tenantId: tenantA, page: 2, limit: 2 });
    expect(secondPage.data).toHaveLength(1);
  });

  it('should summarise Rooms for the tenant by status, type, beds, and occupancy', async () => {
    await createRoom(tenantA, '301', roomTypeA.id, { status: 'OCCUPIED', bedCount: 2 });
    await createRoom(tenantA, '302', roomTypeA.id, { status: 'AVAILABLE', bedCount: 3 });
    await createRoom(tenantA, '303', roomTypeA.id, { status: 'CLEANING', bedCount: 1 });
    await createRoom(tenantB, '301', roomTypeB.id, { status: 'OCCUPIED', bedCount: 9 });

    const summary = await roomRepository.getRoomSummary(tenantA);

    expect(summary).toMatchObject({
      totalRooms: 3,
      totalBeds: 6,
      availableRooms: 1,
      occupancyRate: 33.3,
    });
    expect(summary.byStatus).toEqual([
      { status: 'AVAILABLE', count: 1 },
      { status: 'CLEANING', count: 1 },
      { status: 'OCCUPIED', count: 1 },
    ]);
    expect(summary.byType).toEqual([
      { name: 'Private Room', color: '#2563EB', count: 3, roomTypeId: roomTypeA.id },
    ]);
  });

  it('should report a zero occupancy rate for a tenant with no Rooms', async () => {
    await expect(roomRepository.getRoomSummary(tenantA)).resolves.toMatchObject({
      totalRooms: 0,
      totalBeds: 0,
      occupancyRate: 0,
    });
  });
});
