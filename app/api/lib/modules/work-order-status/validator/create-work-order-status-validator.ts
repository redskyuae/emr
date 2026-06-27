import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  createWorkOrderStatusSchema,
  type CreateWorkOrderStatusInput,
} from '../schemas/work-order-status-schema';
import { validateWorkOrderStatusUniqueness } from './work-order-status-uniqueness-validator';

export async function validateCreateWorkOrderStatus(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateWorkOrderStatusInput>> {
  const result = createWorkOrderStatusSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateWorkOrderStatusUniqueness({
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
