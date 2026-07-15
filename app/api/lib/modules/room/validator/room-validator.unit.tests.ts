import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { roomTypeRepository } from '../../room-type/repository/room-type-repository';
import { roomRepository } from '../repository/room-repository';
import { validateCreateRoom } from './create-room-validator';
import { validateDeleteRoom } from './delete-room-validator';
import { validateGetRoomById } from './get-room-by-id-validator';
import { validateGetRooms } from './get-rooms-validator';
import { getRoomNumberUniqueConstraintErrors } from './room-number-validator';
import { validateUpdateRoom } from './update-room-validator';

vi.mock('../repository/room-repository', () => ({
  roomRepository: {
    getRoomById: vi.fn(),
    findActiveByRoomNumber: vi.fn(),
  },
}));
vi.mock('../../room-type/repository/room-type-repository', () => ({
  roomTypeRepository: {
    getRoomTypeById: vi.fn(),
  },
}));

const repo = vi.mocked(roomRepository);
const roomTypeRepo = vi.mocked(roomTypeRepository);

const roomType = {
  id: 3,
  name: 'Private Room',
  code: 'PVT',
  color: '#2563EB',
  tenantId: 'tenant-1',
  dailyRate: 4500,
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

const existingRoom = {
  id: 1,
  wing: null,
  floor: null,
  status: 'AVAILABLE' as const,
  bedCount: 2,
  tenantId: 'tenant-1',
  createdOn: new Date(),
  modifiedOn: new Date(),
  roomTypeId: 3,
  roomNumber: '101-A',
  notes: null,
  facility: null,
  department: null,
  roomType: { id: 3, name: 'Private Room', code: 'PVT', color: '#2563EB', dailyRate: 4500 },
};

const payload = { roomNumber: '101-A', roomTypeId: 3, status: 'AVAILABLE', bedCount: 2 };

describe('Room validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getRoomById.mockResolvedValue(existingRoom);
    repo.findActiveByRoomNumber.mockResolvedValue(undefined);
    roomTypeRepo.getRoomTypeById.mockResolvedValue(roomType);
  });

  it('should return schema validation errors when the create payload is invalid', async () => {
    const result = await validateCreateRoom({}, 'tenant-1');

    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Room number is required']),
    });
  });

  it('should not call repository checks when schema parsing fails', async () => {
    await validateCreateRoom({}, 'tenant-1');

    expect(roomTypeRepo.getRoomTypeById).not.toHaveBeenCalled();
    expect(repo.findActiveByRoomNumber).not.toHaveBeenCalled();
  });

  it('should return the parsed payload when the Room Type exists and the number is free', async () => {
    await expect(validateCreateRoom(payload, 'tenant-1')).resolves.toMatchObject({
      success: true,
      data: { roomNumber: '101-A', roomTypeId: 3, status: 'AVAILABLE', bedCount: 2 },
    });
  });

  it('should reject a Room Type that does not exist in the Tenant', async () => {
    roomTypeRepo.getRoomTypeById.mockResolvedValue(undefined);

    await expect(validateCreateRoom(payload, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Room type 3 is Invalid.'],
    });
  });

  it('should reject a room number that is already taken in the Tenant', async () => {
    repo.findActiveByRoomNumber.mockResolvedValue({ id: 9, roomNumber: '101-A' });

    await expect(validateCreateRoom(payload, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Room number '101-A' already exists."],
    });
  });

  it('should exclude the edited Room from its own room number check on update', async () => {
    await validateUpdateRoom('1', payload, 'tenant-1');

    expect(repo.findActiveByRoomNumber).toHaveBeenCalledWith('tenant-1', '101-A', { excludeId: 1 });
  });

  it('should return not found when updating a Room that does not exist in the Tenant', async () => {
    repo.getRoomById.mockResolvedValue(undefined);

    await expect(validateUpdateRoom('1', payload, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Room not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should report an invalid id with the exact entity wording', () => {
    expect(validateDeleteRoom('abc', 'tenant-1')).toEqual({
      success: false,
      errors: ['Room abc is Invalid.'],
    });
    expect(validateGetRoomById('abc', 'tenant-1')).toEqual({
      success: false,
      errors: ['Room abc is Invalid.'],
    });
  });

  it('should reject a missing tenant id when listing', () => {
    expect(validateGetRooms('')).toMatchObject({ success: false });
    expect(validateGetRooms('tenant-1')).toEqual({ success: true, data: 'tenant-1' });
  });

  it('should map a wrapped Postgres 23505 room number violation to the duplicate message', () => {
    const wrapped = new Error('insert failed', {
      cause: { code: '23505', constraint: 'room_tenant_room_number_idx' },
    });

    expect(getRoomNumberUniqueConstraintErrors(wrapped, { roomNumber: '101-A' })).toEqual([
      "Room number '101-A' already exists.",
    ]);
  });

  it('should ignore database errors that are not unique constraint violations', () => {
    expect(getRoomNumberUniqueConstraintErrors({ code: '23503' }, { roomNumber: '101-A' })).toEqual(
      []
    );
  });
});
