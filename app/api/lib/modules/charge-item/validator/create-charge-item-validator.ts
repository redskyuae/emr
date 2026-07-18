import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { createChargeItemSchema, type CreateChargeItemInput } from '../schemas/charge-item-schema';
import { validateChargeItemUniqueness } from './charge-item-uniqueness-validator';

export async function validateCreateChargeItem(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateChargeItemInput>> {
  const result = createChargeItemSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateChargeItemUniqueness({
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
