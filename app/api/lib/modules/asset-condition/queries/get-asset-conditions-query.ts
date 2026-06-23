import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { assetConditionRepository } from '../repository/asset-condition-repository';
import type { AssetCondition } from '../schemas/asset-condition-schema';
import { validateGetAssetConditions } from '../validator/get-asset-conditions-validator';

export type GetAssetConditionsParams = {
  tenantId: unknown;
  page?: number;
  limit?: number;
  query?: string;
};

export async function getAssetConditionsQuery({
  tenantId,
  page,
  limit,
  query,
}: GetAssetConditionsParams): Promise<ListQueryResult<AssetCondition>> {
  const tenantIdValidationResult = validateGetAssetConditions(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await assetConditionRepository.getAssetConditions({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
