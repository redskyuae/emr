import type { ValidationResult } from '@/app/api/lib/utils/types';
import { assetTenantIdSchema } from '../schemas/asset-schema';

export function validateGetAssets(tenantId: unknown): ValidationResult<string> {
  const result = assetTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => issue.message),
    };
  }

  return { success: true, data: result.data };
}
