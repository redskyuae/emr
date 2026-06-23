import type { ValidationResult } from '@/app/api/lib/utils/types';
import { assetCategoryTenantIdSchema } from '../schemas/asset-category-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateGetAssetCategories(tenantId: unknown): ValidationResult<string> {
  const result = assetCategoryTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
