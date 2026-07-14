import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { roomRepository } from '../repository/room-repository';
import { validateDeleteRoom } from '../validator/delete-room-validator';

export async function deleteRoomCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<{ id: number }>> {
  const validationResult = validateDeleteRoom(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deleteResult = await roomRepository.deleteRoom(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (deleteResult.outcome === 'not-found') {
    return { success: false, errors: ['Room not found'], status: StatusCodes.NOT_FOUND };
  }

  if (deleteResult.outcome === 'occupied') {
    return {
      success: false,
      errors: ['Room cannot be deleted while it is occupied.'],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: deleteResult.data };
}
