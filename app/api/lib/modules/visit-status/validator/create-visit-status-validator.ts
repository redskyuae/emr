import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  createVisitStatusSchema,
  type CreateVisitStatusInput,
} from '../schemas/visit-status-schema';
import { validateVisitStatusUniqueness } from './visit-status-uniqueness-validator';

export async function validateCreateVisitStatus(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateVisitStatusInput>> {
  const result = createVisitStatusSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateVisitStatusUniqueness({
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
