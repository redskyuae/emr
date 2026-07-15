import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { type CreateRoomInput, createRoomSchema } from '../schemas/room-schema';
import { validateRoomNumberUniqueness } from './room-number-validator';
import { validateRoomReferences } from './room-reference-validator';

export async function validateCreateRoom(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateRoomInput>> {
  const payloadResult = createRoomSchema.safeParse(payload);

  if (!payloadResult.success) {
    return { success: false, errors: formatValidationErrors(payloadResult.error) };
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
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return { success: true, data: payloadResult.data };
}
