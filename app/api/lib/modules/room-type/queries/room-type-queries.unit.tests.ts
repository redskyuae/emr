import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { roomTypeRepository } from '../repository/room-type-repository';
import { getRoomTypeByIdQuery } from './get-room-type-by-id-query';
import { getRoomTypesQuery } from './get-room-types-query';

vi.mock('../repository/room-type-repository', () => ({
  roomTypeRepository: {
    getRoomTypes: vi.fn(),
    getRoomTypeById: vi.fn(),
  },
}));

const repo = vi.mocked(roomTypeRepository);

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

describe('RoomType queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getRoomTypes.mockResolvedValue({ data: [roomType], total: 1 });
    repo.getRoomTypeById.mockResolvedValue(roomType);
  });

  it('should return the paginated list result for a valid tenant', async () => {
    await expect(getRoomTypesQuery({ tenantId: 'tenant-1', page: 2, limit: 5 })).resolves.toEqual({
      success: true,
      data: [roomType],
      total: 1,
    });
    expect(repo.getRoomTypes).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: undefined,
    });
  });

  it('should not hit the repository when the tenant id is missing', async () => {
    const result = await getRoomTypesQuery({ tenantId: '' });

    expect(result.success).toBe(false);
    expect(repo.getRoomTypes).not.toHaveBeenCalled();
  });

  it('should return one Room Type by id', async () => {
    await expect(getRoomTypeByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: roomType,
    });
  });

  it('should return not found when the Room Type is absent from the Tenant', async () => {
    repo.getRoomTypeById.mockResolvedValue(undefined);

    await expect(getRoomTypeByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Room type not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should not hit the repository when the id is invalid', async () => {
    await expect(getRoomTypeByIdQuery('abc', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Room type abc is Invalid.'],
    });
    expect(repo.getRoomTypeById).not.toHaveBeenCalled();
  });
});
