import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  createAssetCategorySchema,
  type CreateAssetCategoryInput,
} from '../schemas/asset-category-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { validateAssetCategoryUniqueness } from './asset-category-uniqueness-validator';

export async function validateCreateAssetCategory(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateAssetCategoryInput>> {
  const result = createAssetCategorySchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateAssetCategoryUniqueness({
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
