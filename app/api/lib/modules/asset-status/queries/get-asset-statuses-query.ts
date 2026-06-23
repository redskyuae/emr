import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { assetStatusRepository } from '../repository/asset-status-repository';
import type { AssetStatus } from '../schemas/asset-status-schema';
import { validateGetAssetStatuses } from '../validator/get-asset-statuses-validator';

export type GetAssetStatusesParams = {
  tenantId: unknown;
  page?: number;
  limit?: number;
  query?: string;
};

export async function getAssetStatusesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetAssetStatusesParams): Promise<ListQueryResult<AssetStatus>> {
  const tenantIdValidationResult = validateGetAssetStatuses(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await assetStatusRepository.getAssetStatuses({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
