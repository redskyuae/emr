import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  createWorkOrderTypeSchema,
  type CreateWorkOrderTypeInput,
} from '../schemas/work-order-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { validateWorkOrderTypeUniqueness } from './work-order-type-uniqueness-validator';

export async function validateCreateWorkOrderType(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateWorkOrderTypeInput>> {
  const result = createWorkOrderTypeSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateWorkOrderTypeUniqueness({
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
