import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { roomRepository } from '../repository/room-repository';
import { validateCreateRoom } from '../validator/create-room-validator';
import { validateDeleteRoom } from '../validator/delete-room-validator';
import { validateUpdateRoom } from '../validator/update-room-validator';
import { createRoomCommand } from './create-room-command';
import { deleteRoomCommand } from './delete-room-command';
import { updateRoomCommand } from './update-room-command';

vi.mock('../repository/room-repository', () => ({
  roomRepository: {
    createRoom: vi.fn(),
    updateRoom: vi.fn(),
    deleteRoom: vi.fn(),
  },
}));
vi.mock('../validator/create-room-validator', () => ({ validateCreateRoom: vi.fn() }));
vi.mock('../validator/update-room-validator', () => ({ validateUpdateRoom: vi.fn() }));
vi.mock('../validator/delete-room-validator', () => ({ validateDeleteRoom: vi.fn() }));

const repo = vi.mocked(roomRepository);
const validateCreate = vi.mocked(validateCreateRoom);
const validateUpdate = vi.mocked(validateUpdateRoom);
const validateDelete = vi.mocked(validateDeleteRoom);

const payload = {
  roomNumber: '101-A',
  roomTypeId: 3,
  status: 'AVAILABLE' as const,
  bedCount: 2,
  floor: undefined,
  wing: undefined,
  facility: undefined,
  department: undefined,
  notes: undefined,
};

const room = {
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

describe('Room commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: payload });
    validateUpdate.mockResolvedValue({ success: true, data: { id: 1, payload } });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createRoom.mockResolvedValue(room);
    repo.updateRoom.mockResolvedValue(room);
    repo.deleteRoom.mockResolvedValue({ outcome: 'deleted', data: { id: 1 } });
  });

  it('should return the validation failure and not write when the validator fails', async () => {
    validateCreate.mockResolvedValue({
      success: false,
      errors: ['Invalid'],
      status: StatusCodes.BAD_REQUEST,
    });

    await expect(createRoomCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
      status: StatusCodes.BAD_REQUEST,
    });
    expect(repo.createRoom).not.toHaveBeenCalled();
  });

  it('should write the validated payload with the session tenant id', async () => {
    await createRoomCommand({}, 'tenant-1');

    expect(repo.createRoom).toHaveBeenCalledWith({ ...payload, tenantId: 'tenant-1' });
  });

  it('should return the created and updated Room on repository success', async () => {
    await expect(createRoomCommand({}, 'tenant-1')).resolves.toEqual({ success: true, data: room });
    await expect(updateRoomCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: room,
    });
  });

  it('should return the deleted Room id on repository success', async () => {
    await expect(deleteRoomCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: { id: 1 },
    });
  });

  it('should map a Postgres 23505 room number violation to a conflict error', async () => {
    repo.createRoom.mockRejectedValue({
      code: '23505',
      constraint: 'room_tenant_room_number_idx',
    });

    await expect(createRoomCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Room number '101-A' already exists."],
    });
  });

  it('should rethrow repository errors that are not constraint violations', async () => {
    const error = new Error('database down');
    repo.updateRoom.mockRejectedValue(error);

    await expect(updateRoomCommand('1', 'tenant-1', {})).rejects.toThrow(error);
  });

  it('should return not found when the update touches no row', async () => {
    repo.updateRoom.mockResolvedValue(undefined);

    await expect(updateRoomCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Room not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should return not found when the delete touches no row', async () => {
    repo.deleteRoom.mockResolvedValue({ outcome: 'not-found' });

    await expect(deleteRoomCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Room not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should refuse to delete an occupied Room', async () => {
    repo.deleteRoom.mockResolvedValue({ outcome: 'occupied' });

    await expect(deleteRoomCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Room cannot be deleted while it is occupied.'],
    });
  });

  it('should preserve the status from a failing validator', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Room type 3 is Invalid.'],
      status: StatusCodes.CONFLICT,
    });

    await expect(updateRoomCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Room type 3 is Invalid.'],
      status: StatusCodes.CONFLICT,
    });
  });
});
