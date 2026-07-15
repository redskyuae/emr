import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { roomRepository } from '../repository/room-repository';
import type { Room } from '../schemas/room-schema';
import { getRoomNumberUniqueConstraintErrors } from '../validator/room-number-validator';
import { validateUpdateRoom } from '../validator/update-room-validator';

export async function updateRoomCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Room>> {
  const validationResult = await validateUpdateRoom(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;
  const roomData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedRoom = await roomRepository.updateRoom(validatedId, roomData);

    if (!updatedRoom) {
      return { success: false, errors: ['Room not found'], status: StatusCodes.NOT_FOUND };
    }

    return { success: true, data: updatedRoom };
  } catch (error) {
    const constraintErrors = getRoomNumberUniqueConstraintErrors(error, roomData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
