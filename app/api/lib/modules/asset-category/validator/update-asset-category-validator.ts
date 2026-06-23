import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  type UpdateAssetCategoryInput,
  updateAssetCategorySchema,
  assetCategoryIdSchema,
} from '../schemas/asset-category-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { assetCategoryRepository } from '../repository/asset-category-repository';
import { validateAssetCategoryUniqueness } from './asset-category-uniqueness-validator';

export type UpdateAssetCategoryParams = {
  id: number;
  payload: UpdateAssetCategoryInput;
};

export async function validateUpdateAssetCategory(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateAssetCategoryParams>> {
  const idResult = assetCategoryIdSchema.safeParse(id);
  const payloadResult = updateAssetCategorySchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Asset category ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingAssetCategory = await assetCategoryRepository.getAssetCategoryById(
    idResult.data,
    tenantId
  );

  if (!existingAssetCategory) {
    return {
      success: false,
      errors: ['Asset category not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateAssetCategoryUniqueness({
    ...payloadResult.data,
    tenantId,
    excludeId: idResult.data,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      payload: payloadResult.data,
    },
  };
}
