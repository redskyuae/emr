import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { roomTypeRepository } from '../repository/room-type-repository';
import {
  roomTypeIdSchema,
  type UpdateRoomTypeInput,
  updateRoomTypeSchema,
} from '../schemas/room-type-schema';
import { validateRoomTypeUniqueness } from './room-type-uniqueness-validator';

export type UpdateRoomTypeParams = {
  id: number;
  payload: UpdateRoomTypeInput;
};

export async function validateUpdateRoomType(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateRoomTypeParams>> {
  const idResult = roomTypeIdSchema.safeParse(id);
  const payloadResult = updateRoomTypeSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Room type ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingRoomType = await roomTypeRepository.getRoomTypeById(idResult.data, tenantId);

  if (!existingRoomType) {
    return {
      success: false,
      errors: ['Room type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateRoomTypeUniqueness({
    ...payloadResult.data,
    tenantId,
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
