import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  assetConditionIdSchema,
  assetConditionTenantIdSchema,
} from '../schemas/asset-condition-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export type GetAssetConditionByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetAssetConditionById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetAssetConditionByIdInput> {
  const idResult = assetConditionIdSchema.safeParse(id);
  const tenantIdResult = assetConditionTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Asset condition ${String(id)} is Invalid.`);
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
