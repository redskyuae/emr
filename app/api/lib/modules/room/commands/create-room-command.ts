import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { roomRepository } from '../repository/room-repository';
import type { Room } from '../schemas/room-schema';
import { validateCreateRoom } from '../validator/create-room-validator';
import { getRoomNumberUniqueConstraintErrors } from '../validator/room-number-validator';

export async function createRoomCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Room>> {
  const validationResult = await validateCreateRoom(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const roomData = { ...validationResult.data, tenantId };

  try {
    const createdRoom = await roomRepository.createRoom(roomData);

    if (!createdRoom) {
      return { success: false, errors: ['Room not found'], status: StatusCodes.NOT_FOUND };
    }

    return { success: true, data: createdRoom };
  } catch (error) {
    const constraintErrors = getRoomNumberUniqueConstraintErrors(error, roomData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
