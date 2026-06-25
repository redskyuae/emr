import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { assetRepository } from '../repository/asset-repository';

const ASSET_SERIAL_NUMBER_EXISTS = "Asset serial number '{value}' already exists.";

type AssetSerialNumberInput = {
  tenantId: string;
  serialNumber: string;
  excludeId?: number;
};

function duplicateError(value: string) {
  return ASSET_SERIAL_NUMBER_EXISTS.replace('{value}', value);
}

export async function validateAssetSerialNumberUniqueness({
  tenantId,
  serialNumber,
  excludeId,
}: AssetSerialNumberInput): Promise<ValidationResult<void>> {
  const existingAsset = await assetRepository.findActiveBySerialNumber(tenantId, serialNumber, {
    excludeId,
  });

  if (existingAsset) {
    return {
      success: false,
      errors: [duplicateError(serialNumber)],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: undefined };
}

export function getAssetSerialNumberUniqueConstraintErrors(
  error: unknown,
  input: Pick<AssetSerialNumberInput, 'serialNumber'>
): string[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const err = error as Record<string, unknown>;

  if (err.code !== '23505') {
    return [];
  }

  if (err.constraint === 'asset_tenant_serial_idx') {
    return [duplicateError(input.serialNumber)];
  }

  return [];
}
