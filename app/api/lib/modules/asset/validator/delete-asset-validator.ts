import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { workOrderRepository } from '../../work-order/repository/work-order-repository';
import { assetRepository } from '../repository/asset-repository';
import { assetIdSchema, assetTenantIdSchema } from '../schemas/asset-schema';

export async function validateDeleteAsset(
  id: unknown,
  tenantId: unknown,
  usage: Pick<typeof workOrderRepository, 'hasActiveWorkOrdersForAsset'> = workOrderRepository
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

  if (await usage.hasActiveWorkOrdersForAsset(idResult.data, tenantIdResult.data)) {
    return {
      success: false,
      errors: ['Asset cannot be deleted while it has active work orders.'],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: idResult.data };
}
