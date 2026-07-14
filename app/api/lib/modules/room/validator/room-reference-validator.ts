import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { roomTypeRepository } from '../../room-type/repository/room-type-repository';
import type { CreateRoomInput, UpdateRoomInput } from '../schemas/room-schema';

type RoomReferenceInput = Pick<CreateRoomInput | UpdateRoomInput, 'roomTypeId'>;

export async function validateRoomReferences(
  input: RoomReferenceInput,
  tenantId: string
): Promise<ValidationResult<void>> {
  const roomType = await roomTypeRepository.getRoomTypeById(input.roomTypeId, tenantId);

  if (!roomType) {
    return {
      success: false,
      errors: [`Room type ${input.roomTypeId} is Invalid.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: undefined };
}
