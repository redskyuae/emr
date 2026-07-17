import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { bedRepository } from '../repository/bed-repository';

const BED_NUMBER_EXISTS = "Bed number '{value}' already exists in ward {ward}.";

type BedNumberUniquenessInput = {
  wardId: number;
  tenantId: string;
  wardName: string;
  bedNumber: string;
  excludeId?: number;
};

function duplicateError(bedNumber: string, wardName: string) {
  return BED_NUMBER_EXISTS.replace('{value}', bedNumber).replace('{ward}', wardName);
}

export async function validateBedNumberUniqueness({
  tenantId,
  wardId,
  wardName,
  bedNumber,
  excludeId,
}: BedNumberUniquenessInput): Promise<ValidationResult<void>> {
  const existing = await bedRepository.findActiveByBedNumber(tenantId, wardId, bedNumber, {
    excludeId,
  });

  if (existing) {
    return {
      success: false,
      errors: [duplicateError(bedNumber, wardName)],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: undefined };
}

export function getBedNumberUniqueConstraintErrors(
  error: unknown,
  input: Pick<BedNumberUniquenessInput, 'bedNumber' | 'wardName'>
): string[] {
  const databaseError = getDatabaseError(error);

  if (databaseError?.code !== '23505') {
    return [];
  }

  if (databaseError.constraint === 'bed_ward_bed_number_idx') {
    return [duplicateError(input.bedNumber, input.wardName)];
  }

  return [];
}
