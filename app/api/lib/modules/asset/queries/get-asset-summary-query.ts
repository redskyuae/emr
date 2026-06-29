import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { assetRepository } from '../repository/asset-repository';
import type { AssetSummary } from '../schemas/asset-schema';
import { validateGetAssetSummary } from '../validator/get-asset-summary-validator';

type AssetSummaryReader = Pick<typeof assetRepository, 'getAssetSummary'>;

export async function getAssetSummaryQuery(
  tenantId: unknown,
  repository: AssetSummaryReader = assetRepository
): Promise<SingleQueryResult<AssetSummary>> {
  const tenantResult = validateGetAssetSummary(tenantId);

  if (!tenantResult.success) {
    return tenantResult;
  }

  const summary = await repository.getAssetSummary(tenantResult.data);

  return { success: true, data: summary };
}
