import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { roomTypeRepository } from '../repository/room-type-repository';
import type { RoomType } from '../schemas/room-type-schema';
import { validateGetRoomTypeById } from '../validator/get-room-type-by-id-validator';

export async function getRoomTypeByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<RoomType>> {
  const validationResult = validateGetRoomTypeById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const roomType = await roomTypeRepository.getRoomTypeById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!roomType) {
    return {
      success: false,
      errors: ['Room type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: roomType };
}
