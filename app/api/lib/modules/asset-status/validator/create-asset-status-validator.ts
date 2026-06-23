import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  createAssetStatusSchema,
  type CreateAssetStatusInput,
} from '../schemas/asset-status-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { validateAssetStatusUniqueness } from './asset-status-uniqueness-validator';

export async function validateCreateAssetStatus(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateAssetStatusInput>> {
  const result = createAssetStatusSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateAssetStatusUniqueness({
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
