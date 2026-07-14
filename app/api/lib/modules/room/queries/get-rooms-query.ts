import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { roomRepository } from '../repository/room-repository';
import type { Room, RoomStatus } from '../schemas/room-schema';
import { validateGetRooms } from '../validator/get-rooms-validator';

export type GetRoomsParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: unknown;
  status?: RoomStatus;
  roomTypeId?: number;
};

export async function getRoomsQuery({
  tenantId,
  page,
  limit,
  query,
  status,
  roomTypeId,
}: GetRoomsParams): Promise<ListQueryResult<Room>> {
  const tenantIdValidationResult = validateGetRooms(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await roomRepository.getRooms({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
    status,
    roomTypeId,
  });

  return { success: true, data, total };
}
