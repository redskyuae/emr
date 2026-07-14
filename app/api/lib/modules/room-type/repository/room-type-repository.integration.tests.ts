import { describe, expect, it } from 'vitest';

import { roomRepository } from '../../room/repository/room-repository';
import { roomTypeRepository } from './room-type-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createRoomType = (tenantId: string, name: string, code: string, dailyRate?: number) =>
  roomTypeRepository.createRoomType({
    tenantId,
    name,
    code,
    color: '#2563EB',
    dailyRate,
    description: undefined,
  });

describe('RoomType repository', () => {
  it('should create a Room Type for a tenant', async () => {
    const created = await createRoomType(tenantA, 'Private Room', 'PVT', 4500);

    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'Private Room',
      code: 'PVT',
      color: '#2563EB',
      dailyRate: 4500,
    });
  });

  it('should read a Room Type by id within the same tenant only', async () => {
    const created = await createRoomType(tenantA, 'Deluxe Room', 'DLX');

    await expect(roomTypeRepository.getRoomTypeById(created.id, tenantA)).resolves.toMatchObject({
      id: created.id,
      tenantId: tenantA,
    });
    await expect(roomTypeRepository.getRoomTypeById(created.id, tenantB)).resolves.toBeUndefined();
  });

  it('should list only Room Types belonging to the requested tenant', async () => {
    await createRoomType(tenantA, 'General Ward', 'GEN');
    await createRoomType(tenantB, 'Suite', 'STE');

    const result = await roomTypeRepository.getRoomTypes({ tenantId: tenantA });

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should exclude soft-deleted Room Types from reads', async () => {
    const deleted = await createRoomType(tenantA, 'Semi Private', 'SEM');
    await createRoomType(tenantA, 'Intensive Care', 'ICU');

    const deleteResult = await roomTypeRepository.deleteRoomType(deleted.id, tenantA);
    expect(deleteResult.outcome).toBe('deleted');

    const result = await roomTypeRepository.getRoomTypes({ tenantId: tenantA });
    expect(result.data.map((roomType) => roomType.code)).toEqual(['ICU']);
    await expect(roomTypeRepository.getRoomTypeById(deleted.id, tenantA)).resolves.toBeUndefined();
  });

  it('should not delete a Room Type from another tenant', async () => {
    const created = await createRoomType(tenantA, 'Isolation Room', 'ISO');

    await expect(roomTypeRepository.deleteRoomType(created.id, tenantB)).resolves.toEqual({
      outcome: 'not-found',
    });
    await expect(roomTypeRepository.getRoomTypeById(created.id, tenantA)).resolves.toBeDefined();
  });

  it('should refuse to delete a Room Type that still has an active Room assigned', async () => {
    const roomType = await createRoomType(tenantA, 'Maternity Room', 'MAT');
    const room = await roomRepository.createRoom({
      tenantId: tenantA,
      roomNumber: '201',
      roomTypeId: roomType.id,
      status: 'AVAILABLE',
      bedCount: 1,
    });

    await expect(roomTypeRepository.deleteRoomType(roomType.id, tenantA)).resolves.toEqual({
      outcome: 'in-use',
    });

    await roomRepository.deleteRoom(room!.id, tenantA);

    const afterRoomRemoved = await roomTypeRepository.deleteRoomType(roomType.id, tenantA);
    expect(afterRoomRemoved.outcome).toBe('deleted');
  });

  it('should update only an active Room Type in the requested tenant', async () => {
    const created = await createRoomType(tenantA, 'Recovery Room', 'REC');

    await expect(
      roomTypeRepository.updateRoomType(created.id, {
        tenantId: tenantA,
        name: 'Recovery Suite',
        code: 'RCS',
        color: '#16A34A',
        dailyRate: 6000,
        description: 'Post-operative recovery.',
      })
    ).resolves.toMatchObject({ name: 'Recovery Suite', code: 'RCS', dailyRate: 6000 });

    await roomTypeRepository.deleteRoomType(created.id, tenantA);

    await expect(
      roomTypeRepository.updateRoomType(created.id, {
        tenantId: tenantA,
        name: 'Recovery Suite',
        code: 'RCS',
        color: '#16A34A',
        dailyRate: undefined,
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive name and code uniqueness within a tenant', async () => {
    await createRoomType(tenantA, 'Private Room', 'PVT');

    await expect(createRoomType(tenantA, 'private room', 'OTH')).rejects.toMatchObject({
      cause: expect.objectContaining({ code: '23505' }),
    });
    await expect(createRoomType(tenantA, 'Other Room', 'pvt')).rejects.toMatchObject({
      cause: expect.objectContaining({ code: '23505' }),
    });
  });

  it('should allow the same name and code in a different tenant', async () => {
    await createRoomType(tenantA, 'Private Room', 'PVT');

    await expect(createRoomType(tenantB, 'Private Room', 'PVT')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should free a name for reuse once the holding Room Type is soft-deleted', async () => {
    const created = await createRoomType(tenantA, 'Day Care Room', 'DAY');
    await roomTypeRepository.deleteRoomType(created.id, tenantA);

    await expect(createRoomType(tenantA, 'Day Care Room', 'DAY')).resolves.toMatchObject({
      name: 'Day Care Room',
    });
  });

  it('should find active Room Types by name and code, honouring the exclude id', async () => {
    const created = await createRoomType(tenantA, 'Twin Sharing', 'TWN');

    await expect(
      roomTypeRepository.findActiveByName(tenantA, 'twin sharing')
    ).resolves.toMatchObject({ id: created.id });
    await expect(roomTypeRepository.findActiveByCode(tenantA, 'twn')).resolves.toMatchObject({
      id: created.id,
    });
    await expect(
      roomTypeRepository.findActiveByName(tenantA, 'Twin Sharing', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });

  it('should search and paginate Room Types', async () => {
    await createRoomType(tenantA, 'Private Room', 'PVT');
    await createRoomType(tenantA, 'Private Suite', 'PVS');
    await createRoomType(tenantA, 'General Ward', 'GEN');

    const searched = await roomTypeRepository.getRoomTypes({ tenantId: tenantA, query: 'private' });
    expect(searched.total).toBe(2);

    const firstPage = await roomTypeRepository.getRoomTypes({
      tenantId: tenantA,
      page: 1,
      limit: 2,
    });
    expect(firstPage.total).toBe(3);
    expect(firstPage.data).toHaveLength(2);

    const secondPage = await roomTypeRepository.getRoomTypes({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(secondPage.data).toHaveLength(1);
  });
});
