import type { ValidationResult } from '@/app/api/lib/utils/types';
import { assetIdSchema, assetTenantIdSchema } from '../schemas/asset-schema';

export type GetAssetByIdParams = {
  id: number;
  tenantId: string;
};

export function validateGetAssetById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetAssetByIdParams> {
  const idResult = assetIdSchema.safeParse(id);
  const tenantIdResult = assetTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Asset ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...tenantIdResult.error.issues.map((issue) => issue.message));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      tenantId: tenantIdResult.data,
    },
  };
}
