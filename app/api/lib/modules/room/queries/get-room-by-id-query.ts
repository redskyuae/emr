import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { roomRepository } from '../repository/room-repository';
import type { Room } from '../schemas/room-schema';
import { validateGetRoomById } from '../validator/get-room-by-id-validator';

export async function getRoomByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<Room>> {
  const validationResult = validateGetRoomById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const room = await roomRepository.getRoomById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!room) {
    return { success: false, errors: ['Room not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: room };
}
