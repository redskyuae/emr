import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { type CreateRoomTypeInput, createRoomTypeSchema } from '../schemas/room-type-schema';
import { validateRoomTypeUniqueness } from './room-type-uniqueness-validator';

export async function validateCreateRoomType(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateRoomTypeInput>> {
  const result = createRoomTypeSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateRoomTypeUniqueness({
    ...result.data,
    tenantId,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return { success: true, data: result.data };
}
