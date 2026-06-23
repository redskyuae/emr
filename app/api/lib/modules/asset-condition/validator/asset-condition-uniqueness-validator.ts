import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { assetConditionRepository } from '../repository/asset-condition-repository';
const ASSET_CONDITION_NAME_EXISTS = "Asset condition name '{value}' already exists.";
const ASSET_CONDITION_CODE_EXISTS = "Asset condition code '{value}' already exists.";

type AssetConditionUniquenessInput = {
  tenantId: string;
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateAssetConditionUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: AssetConditionUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    assetConditionRepository.findActiveByName(tenantId, name, { excludeId }),
    assetConditionRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(ASSET_CONDITION_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(ASSET_CONDITION_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getAssetConditionUniqueConstraintErrors(
  error: unknown,
  input: Pick<AssetConditionUniquenessInput, 'name' | 'code'>
): string[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const err = error as Record<string, unknown>;

  if (err.code !== '23505') {
    return [];
  }

  if (err.constraint === 'asset_condition_tenant_name_idx') {
    return [duplicateError(ASSET_CONDITION_NAME_EXISTS, input.name)];
  }

  if (err.constraint === 'asset_condition_tenant_code_idx') {
    return [duplicateError(ASSET_CONDITION_CODE_EXISTS, input.code)];
  }

  return [];
}
