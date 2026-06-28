import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { assetConditionRepository } from '../repository/asset-condition-repository';
import type { AssetCondition } from '../schemas/asset-condition-schema';
import { validateDeleteAssetCondition } from '../validator/delete-asset-condition-validator';

export async function deleteAssetConditionCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<AssetCondition>> {
  const validationResult = validateDeleteAssetCondition(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedAssetCondition = await assetConditionRepository.deleteAssetCondition(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedAssetCondition) {
    return {
      success: false,
      errors: ['Asset condition not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedAssetCondition };
}
