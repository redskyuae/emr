import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { assetTenantIdSchema } from '../schemas/asset-schema';

export function validateGetAssetSummary(tenantId: unknown): ValidationResult<string> {
  const result = assetTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
