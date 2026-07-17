import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { wardRepository } from '../repository/ward-repository';

const WARD_NAME_EXISTS = "Ward name '{value}' already exists.";
const WARD_CODE_EXISTS = "Ward code '{value}' already exists.";

type WardUniquenessInput = {
  name: string;
  code: string;
  tenantId: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateWardUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: WardUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    wardRepository.findActiveByName(tenantId, name, { excludeId }),
    wardRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(WARD_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(WARD_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getWardUniqueConstraintErrors(
  error: unknown,
  input: Pick<WardUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'ward_tenant_name_idx') {
    return [duplicateError(WARD_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'ward_tenant_code_idx') {
    return [duplicateError(WARD_CODE_EXISTS, input.code)];
  }

  return [];
}
