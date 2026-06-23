import type { ValidationResult } from '@/app/api/lib/utils/types';
import { assetConditionTenantIdSchema } from '../schemas/asset-condition-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateGetAssetConditions(tenantId: unknown): ValidationResult<string> {
  const result = assetConditionTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
