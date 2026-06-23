import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { assetStatusRepository } from '../repository/asset-status-repository';
import type { AssetStatus } from '../schemas/asset-status-schema';
import { validateGetAssetStatusById } from '../validator/get-asset-status-by-id-validator';

export async function getAssetStatusByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<AssetStatus>> {
  const validationResult = validateGetAssetStatusById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const assetStatus = await assetStatusRepository.getAssetStatusById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!assetStatus) {
    return {
      success: false,
      errors: ['Asset status not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: assetStatus };
}
