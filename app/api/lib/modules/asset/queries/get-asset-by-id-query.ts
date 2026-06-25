import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { assetRepository } from '../repository/asset-repository';
import type { Asset } from '../schemas/asset-schema';
import { validateGetAssetById } from '../validator/get-asset-by-id-validator';

export async function getAssetByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<Asset>> {
  const validationResult = validateGetAssetById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const asset = await assetRepository.getAssetById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!asset) {
    return { success: false, errors: ['Asset not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: asset };
}
