import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  createAssetConditionSchema,
  type CreateAssetConditionInput,
} from '../schemas/asset-condition-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { validateAssetConditionUniqueness } from './asset-condition-uniqueness-validator';

export async function validateCreateAssetCondition(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateAssetConditionInput>> {
  const result = createAssetConditionSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateAssetConditionUniqueness({
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
