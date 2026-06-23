import type { ValidationResult } from '@/app/api/lib/utils/types';
import { assetStatusIdSchema, assetStatusTenantIdSchema } from '../schemas/asset-status-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export type GetAssetStatusByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetAssetStatusById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetAssetStatusByIdInput> {
  const idResult = assetStatusIdSchema.safeParse(id);
  const tenantIdResult = assetStatusTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Asset status ${String(id)} is Invalid.`);
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
