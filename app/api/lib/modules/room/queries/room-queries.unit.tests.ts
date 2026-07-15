import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { roomRepository } from '../repository/room-repository';
import { getRoomByIdQuery } from './get-room-by-id-query';
import { getRoomSummaryQuery } from './get-room-summary-query';
import { getRoomsQuery } from './get-rooms-query';

vi.mock('../repository/room-repository', () => ({
  roomRepository: {
    getRooms: vi.fn(),
    getRoomById: vi.fn(),
    getRoomSummary: vi.fn(),
  },
}));

const repo = vi.mocked(roomRepository);

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

const summary = {
  byType: [{ name: 'Private Room', color: '#2563EB', count: 1, roomTypeId: 3 }],
  byStatus: [{ status: 'AVAILABLE' as const, count: 1 }],
  totalRooms: 1,
  totalBeds: 2,
  availableRooms: 1,
  occupancyRate: 0,
};

describe('Room queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getRooms.mockResolvedValue({ data: [room], total: 1 });
    repo.getRoomById.mockResolvedValue(room);
    repo.getRoomSummary.mockResolvedValue(summary);
  });

  it('should pass the status and Room Type filters through to the repository', async () => {
    await expect(
      getRoomsQuery({ tenantId: 'tenant-1', page: 1, limit: 10, status: 'OCCUPIED', roomTypeId: 3 })
    ).resolves.toEqual({ success: true, data: [room], total: 1 });

    expect(repo.getRooms).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 1,
      limit: 10,
      query: undefined,
      status: 'OCCUPIED',
      roomTypeId: 3,
    });
  });

  it('should not hit the repository when the tenant id is missing', async () => {
    const result = await getRoomsQuery({ tenantId: '' });

    expect(result.success).toBe(false);
    expect(repo.getRooms).not.toHaveBeenCalled();
  });

  it('should return one Room by id', async () => {
    await expect(getRoomByIdQuery('1', 'tenant-1')).resolves.toEqual({ success: true, data: room });
  });

  it('should return not found when the Room is absent from the Tenant', async () => {
    repo.getRoomById.mockResolvedValue(undefined);

    await expect(getRoomByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Room not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should not hit the repository when the id is invalid', async () => {
    await expect(getRoomByIdQuery('abc', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Room abc is Invalid.'],
    });
    expect(repo.getRoomById).not.toHaveBeenCalled();
  });

  it('should return the Room summary for a valid tenant', async () => {
    await expect(getRoomSummaryQuery('tenant-1')).resolves.toEqual({
      success: true,
      data: summary,
    });
  });

  it('should not hit the repository for a summary without a tenant id', async () => {
    const result = await getRoomSummaryQuery('');

    expect(result.success).toBe(false);
    expect(repo.getRoomSummary).not.toHaveBeenCalled();
  });
});
