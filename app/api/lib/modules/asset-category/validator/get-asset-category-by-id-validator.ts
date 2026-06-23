import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  assetCategoryIdSchema,
  assetCategoryTenantIdSchema,
} from '../schemas/asset-category-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export type GetAssetCategoryByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetAssetCategoryById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetAssetCategoryByIdInput> {
  const idResult = assetCategoryIdSchema.safeParse(id);
  const tenantIdResult = assetCategoryTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Asset category ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
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
