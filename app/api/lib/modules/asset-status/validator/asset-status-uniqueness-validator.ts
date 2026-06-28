import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { assetStatusRepository } from '../repository/asset-status-repository';
const ASSET_STATUS_NAME_EXISTS = "Asset status name '{value}' already exists.";
const ASSET_STATUS_CODE_EXISTS = "Asset status code '{value}' already exists.";

type AssetStatusUniquenessInput = {
  name: string;
  code: string;
  tenantId: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateAssetStatusUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: AssetStatusUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    assetStatusRepository.findActiveByName(tenantId, name, { excludeId }),
    assetStatusRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(ASSET_STATUS_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(ASSET_STATUS_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getAssetStatusUniqueConstraintErrors(
  error: unknown,
  input: Pick<AssetStatusUniquenessInput, 'name' | 'code'>
): string[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const err = error as Record<string, unknown>;

  if (err.code !== '23505') {
    return [];
  }

  if (err.constraint === 'asset_status_tenant_name_idx') {
    return [duplicateError(ASSET_STATUS_NAME_EXISTS, input.name)];
  }

  if (err.constraint === 'asset_status_tenant_code_idx') {
    return [duplicateError(ASSET_STATUS_CODE_EXISTS, input.code)];
  }

  return [];
}
