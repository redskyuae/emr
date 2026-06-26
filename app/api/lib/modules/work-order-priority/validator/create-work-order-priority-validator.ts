import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  createWorkOrderPrioritySchema,
  type CreateWorkOrderPriorityInput,
} from '../schemas/work-order-priority-schema';
import { validateWorkOrderPriorityUniqueness } from './work-order-priority-uniqueness-validator';

export async function validateCreateWorkOrderPriority(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateWorkOrderPriorityInput>> {
  const result = createWorkOrderPrioritySchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateWorkOrderPriorityUniqueness({
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
