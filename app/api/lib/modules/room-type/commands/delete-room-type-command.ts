import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { roomTypeRepository } from '../repository/room-type-repository';
import type { RoomType } from '../schemas/room-type-schema';
import { validateDeleteRoomType } from '../validator/delete-room-type-validator';

export async function deleteRoomTypeCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<RoomType>> {
  const validationResult = validateDeleteRoomType(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deleteResult = await roomTypeRepository.deleteRoomType(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (deleteResult.outcome === 'not-found') {
    return {
      success: false,
      errors: ['Room type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  if (deleteResult.outcome === 'in-use') {
    return {
      success: false,
      errors: ['Room type cannot be deleted while Rooms are assigned to it.'],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: deleteResult.data };
}
