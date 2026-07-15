import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { roomRepository } from '../repository/room-repository';
import { roomIdSchema, type UpdateRoomInput, updateRoomSchema } from '../schemas/room-schema';
import { validateRoomNumberUniqueness } from './room-number-validator';
import { validateRoomReferences } from './room-reference-validator';

export type UpdateRoomParams = {
  id: number;
  payload: UpdateRoomInput;
};

export async function validateUpdateRoom(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateRoomParams>> {
  const idResult = roomIdSchema.safeParse(id);
  const payloadResult = updateRoomSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Room ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingRoom = await roomRepository.getRoomById(idResult.data, tenantId);

  if (!existingRoom) {
    return { success: false, errors: ['Room not found'], status: StatusCodes.NOT_FOUND };
  }

  const referenceResult = await validateRoomReferences(payloadResult.data, tenantId);

  if (!referenceResult.success) {
    return {
      success: false,
      errors: referenceResult.errors,
      status: referenceResult.status,
    };
  }

  const uniquenessResult = await validateRoomNumberUniqueness({
    tenantId,
    roomNumber: payloadResult.data.roomNumber,
    excludeId: idResult.data,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      payload: payloadResult.data,
    },
  };
}
