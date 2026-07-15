import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { roomTypeRepository } from '../repository/room-type-repository';
import { validateCreateRoomType } from '../validator/create-room-type-validator';
import { validateDeleteRoomType } from '../validator/delete-room-type-validator';
import { validateUpdateRoomType } from '../validator/update-room-type-validator';
import { createRoomTypeCommand } from './create-room-type-command';
import { deleteRoomTypeCommand } from './delete-room-type-command';
import { updateRoomTypeCommand } from './update-room-type-command';

vi.mock('../repository/room-type-repository', () => ({
  roomTypeRepository: {
    createRoomType: vi.fn(),
    updateRoomType: vi.fn(),
    deleteRoomType: vi.fn(),
  },
}));
vi.mock('../validator/create-room-type-validator', () => ({
  validateCreateRoomType: vi.fn(),
}));
vi.mock('../validator/update-room-type-validator', () => ({
  validateUpdateRoomType: vi.fn(),
}));
vi.mock('../validator/delete-room-type-validator', () => ({
  validateDeleteRoomType: vi.fn(),
}));

const repo = vi.mocked(roomTypeRepository);
const validateCreate = vi.mocked(validateCreateRoomType);
const validateUpdate = vi.mocked(validateUpdateRoomType);
const validateDelete = vi.mocked(validateDeleteRoomType);

const roomType = {
  id: 1,
  name: 'Private Room',
  code: 'PVT',
  color: '#2563EB',
  tenantId: 'tenant-1',
  dailyRate: 4500,
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

const payload = {
  name: 'Private Room',
  code: 'PVT',
  color: '#2563EB',
  dailyRate: 4500,
  description: undefined,
};

describe('RoomType commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: payload });
    validateUpdate.mockResolvedValue({ success: true, data: { id: 1, payload } });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createRoomType.mockResolvedValue(roomType);
    repo.updateRoomType.mockResolvedValue(roomType);
    repo.deleteRoomType.mockResolvedValue({ outcome: 'deleted', data: roomType });
  });

  it('should return the validation failure and not write when the validator fails', async () => {
    validateCreate.mockResolvedValue({
      success: false,
      errors: ['Invalid'],
      status: StatusCodes.BAD_REQUEST,
    });

    await expect(createRoomTypeCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
      status: StatusCodes.BAD_REQUEST,
    });
    expect(repo.createRoomType).not.toHaveBeenCalled();
  });

  it('should write the validated payload with the session tenant id', async () => {
    await createRoomTypeCommand({}, 'tenant-1');

    expect(repo.createRoomType).toHaveBeenCalledWith({ ...payload, tenantId: 'tenant-1' });
  });

  it('should return created, updated, and deleted Room Types on repository success', async () => {
    await expect(createRoomTypeCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: roomType,
    });
    await expect(updateRoomTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: roomType,
    });
    await expect(deleteRoomTypeCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: roomType,
    });
  });

  it('should map a Postgres 23505 name constraint violation to a conflict error', async () => {
    repo.createRoomType.mockRejectedValue({
      code: '23505',
      constraint: 'room_type_tenant_name_idx',
    });

    await expect(createRoomTypeCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Room type name 'Private Room' already exists."],
    });
  });

  it('should map a Postgres 23505 code constraint violation to a conflict error', async () => {
    repo.updateRoomType.mockRejectedValue({
      code: '23505',
      constraint: 'room_type_tenant_code_idx',
    });

    await expect(updateRoomTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Room type code 'PVT' already exists."],
    });
  });

  it('should rethrow repository errors that are not constraint violations', async () => {
    const error = new Error('database down');
    repo.createRoomType.mockRejectedValue(error);

    await expect(createRoomTypeCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should return not found when the update touches no row', async () => {
    repo.updateRoomType.mockResolvedValue(undefined);

    await expect(updateRoomTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Room type not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should return not found when the delete touches no row', async () => {
    repo.deleteRoomType.mockResolvedValue({ outcome: 'not-found' });

    await expect(deleteRoomTypeCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Room type not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should refuse to delete a Room Type that still has Rooms assigned to it', async () => {
    repo.deleteRoomType.mockResolvedValue({ outcome: 'in-use' });

    await expect(deleteRoomTypeCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Room type cannot be deleted while Rooms are assigned to it.'],
    });
  });

  it('should preserve the status from a failing validator', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });

    await expect(updateRoomTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
  });
});
