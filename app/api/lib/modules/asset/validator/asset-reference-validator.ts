import { StatusCodes } from 'http-status-codes';

import { assetCategoryRepository } from '../../asset-category/repository/asset-category-repository';
import { assetConditionRepository } from '../../asset-condition/repository/asset-condition-repository';
import { assetStatusRepository } from '../../asset-status/repository/asset-status-repository';
import type { CreateAssetInput, UpdateAssetInput } from '../schemas/asset-schema';
import type { ValidationResult } from '@/app/api/lib/utils/types';

type AssetReferenceInput = Pick<
  CreateAssetInput | UpdateAssetInput,
  'categoryId' | 'statusId' | 'conditionId'
>;

export async function validateAssetReferences(
  input: AssetReferenceInput,
  tenantId: string
): Promise<ValidationResult<void>> {
  const [category, status, condition] = await Promise.all([
    assetCategoryRepository.getAssetCategoryById(input.categoryId, tenantId),
    assetStatusRepository.getAssetStatusById(input.statusId, tenantId),
    input.conditionId
      ? assetConditionRepository.getAssetConditionById(input.conditionId, tenantId)
      : Promise.resolve(undefined),
  ]);

  const errors: string[] = [];

  if (!category) {
    errors.push(`Asset category ${input.categoryId} is Invalid.`);
  }

  if (!status) {
    errors.push(`Asset status ${input.statusId} is Invalid.`);
  }

  if (input.conditionId && !condition) {
    errors.push(`Asset condition ${input.conditionId} is Invalid.`);
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}
