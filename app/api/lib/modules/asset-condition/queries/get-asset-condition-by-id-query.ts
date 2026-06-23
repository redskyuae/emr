import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { assetConditionRepository } from '../repository/asset-condition-repository';
import type { AssetCondition } from '../schemas/asset-condition-schema';
import { validateGetAssetConditionById } from '../validator/get-asset-condition-by-id-validator';

export async function getAssetConditionByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<AssetCondition>> {
  const validationResult = validateGetAssetConditionById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const assetCondition = await assetConditionRepository.getAssetConditionById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!assetCondition) {
    return {
      success: false,
      errors: ['Asset condition not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: assetCondition };
}
