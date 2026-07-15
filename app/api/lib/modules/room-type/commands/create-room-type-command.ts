import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { roomTypeRepository } from '../repository/room-type-repository';
import type { RoomType } from '../schemas/room-type-schema';
import { validateCreateRoomType } from '../validator/create-room-type-validator';
import { getRoomTypeUniqueConstraintErrors } from '../validator/room-type-uniqueness-validator';

export async function createRoomTypeCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<RoomType>> {
  const validationResult = await validateCreateRoomType(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const roomTypeData = { ...validationResult.data, tenantId };

  try {
    const createdRoomType = await roomTypeRepository.createRoomType(roomTypeData);
    return { success: true, data: createdRoomType };
  } catch (error) {
    const constraintErrors = getRoomTypeUniqueConstraintErrors(error, roomTypeData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
