import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { roomTypeRepository } from '../repository/room-type-repository';
import type { RoomType } from '../schemas/room-type-schema';
import { getRoomTypeUniqueConstraintErrors } from '../validator/room-type-uniqueness-validator';
import { validateUpdateRoomType } from '../validator/update-room-type-validator';

export async function updateRoomTypeCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<RoomType>> {
  const validationResult = await validateUpdateRoomType(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;
  const roomTypeData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedRoomType = await roomTypeRepository.updateRoomType(validatedId, roomTypeData);

    if (!updatedRoomType) {
      return {
        success: false,
        errors: ['Room type not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedRoomType };
  } catch (error) {
    const constraintErrors = getRoomTypeUniqueConstraintErrors(error, roomTypeData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
