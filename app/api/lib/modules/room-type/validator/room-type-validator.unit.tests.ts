import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { roomTypeRepository } from '../repository/room-type-repository';
import { validateCreateRoomType } from './create-room-type-validator';
import { validateDeleteRoomType } from './delete-room-type-validator';
import { validateGetRoomTypeById } from './get-room-type-by-id-validator';
import { validateGetRoomTypes } from './get-room-types-validator';
import { getRoomTypeUniqueConstraintErrors } from './room-type-uniqueness-validator';
import { validateUpdateRoomType } from './update-room-type-validator';

vi.mock('../repository/room-type-repository', () => ({
  roomTypeRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getRoomTypeById: vi.fn(),
  },
}));

const repo = vi.mocked(roomTypeRepository);

const existing = {
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

const payload = { name: 'Private Room', code: 'PVT', color: '#2563EB', dailyRate: 4500 };

describe('RoomType validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getRoomTypeById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when the create payload is invalid', async () => {
    const result = await validateCreateRoomType({}, 'tenant-1');

    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Room type name is required']),
    });
  });

  it('should not call uniqueness repository checks when schema parsing fails', async () => {
    await validateCreateRoomType({}, 'tenant-1');

    expect(repo.findActiveByName).not.toHaveBeenCalled();
    expect(repo.findActiveByCode).not.toHaveBeenCalled();
  });

  it('should return the parsed payload when the create payload is valid and unique', async () => {
    await expect(validateCreateRoomType(payload, 'tenant-1')).resolves.toMatchObject({
      success: true,
      data: { name: 'Private Room', code: 'PVT', color: '#2563EB', dailyRate: 4500 },
    });
  });

  it('should return a conflict when the name already exists in the Tenant', async () => {
    repo.findActiveByName.mockResolvedValue(existing);

    await expect(validateCreateRoomType(payload, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Room type name 'Private Room' already exists."],
    });
  });

  it('should return a conflict when the code already exists in the Tenant', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);

    await expect(validateCreateRoomType(payload, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Room type code 'PVT' already exists."],
    });
  });

  it('should exclude the edited Room Type from its own uniqueness check on update', async () => {
    await validateUpdateRoomType('1', payload, 'tenant-1');

    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Private Room', {
      excludeId: 1,
    });
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'PVT', { excludeId: 1 });
  });

  it('should return not found when updating a Room Type that does not exist in the Tenant', async () => {
    repo.getRoomTypeById.mockResolvedValue(undefined);

    await expect(validateUpdateRoomType('1', payload, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Room type not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should report an invalid id with the exact entity wording', () => {
    expect(validateDeleteRoomType('abc', 'tenant-1')).toEqual({
      success: false,
      errors: ['Room type abc is Invalid.'],
    });
    expect(validateGetRoomTypeById('abc', 'tenant-1')).toEqual({
      success: false,
      errors: ['Room type abc is Invalid.'],
    });
  });

  it('should reject a missing tenant id when listing', () => {
    expect(validateGetRoomTypes('')).toMatchObject({ success: false });
    expect(validateGetRoomTypes('tenant-1')).toEqual({ success: true, data: 'tenant-1' });
  });

  it('should map a wrapped Postgres 23505 error to the matching duplicate message', () => {
    const wrapped = new Error('insert failed', {
      cause: { code: '23505', constraint: 'room_type_tenant_code_idx' },
    });

    expect(
      getRoomTypeUniqueConstraintErrors(wrapped, { name: 'Private Room', code: 'PVT' })
    ).toEqual(["Room type code 'PVT' already exists."]);
  });

  it('should ignore database errors that are not unique constraint violations', () => {
    expect(
      getRoomTypeUniqueConstraintErrors({ code: '23503' }, { name: 'Private Room', code: 'PVT' })
    ).toEqual([]);
  });
});
