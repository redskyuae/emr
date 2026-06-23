import type { ValidationResult } from '@/app/api/lib/utils/types';
import { assetStatusTenantIdSchema } from '../schemas/asset-status-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateGetAssetStatuses(tenantId: unknown): ValidationResult<string> {
  const result = assetStatusTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
