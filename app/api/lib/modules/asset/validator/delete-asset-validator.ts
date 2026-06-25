import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { assetRepository } from '../repository/asset-repository';
import { assetIdSchema, assetTenantIdSchema } from '../schemas/asset-schema';

export async function validateDeleteAsset(
  id: unknown,
  tenantId: unknown
): Promise<ValidationResult<number>> {
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

  const existingAsset = await assetRepository.getAssetById(idResult.data, tenantIdResult.data);

  if (!existingAsset) {
    return {
      success: false,
      errors: ['Asset not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: idResult.data };
}
