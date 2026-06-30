import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { specialtyRepository } from '../repository/specialty-repository';

const SPECIALTY_NAME_EXISTS = 'Specialty name {value} already exists.';
const SPECIALTY_CODE_EXISTS = 'Specialty code {value} already exists.';

type SpecialtyUniquenessInput = {
  name: string;
  code?: string;
  tenantId: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateSpecialtyUniqueness({
  name,
  code,
  tenantId,
  excludeId,
}: SpecialtyUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    specialtyRepository.findActiveByName(tenantId, name, { excludeId }),
    code
      ? specialtyRepository.findActiveByCode(tenantId, code, { excludeId })
      : Promise.resolve(undefined),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(SPECIALTY_NAME_EXISTS, name));
  }

  if (existingCode && code) {
    errors.push(duplicateError(SPECIALTY_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getSpecialtyUniqueConstraintErrors(
  error: unknown,
  input: Pick<SpecialtyUniquenessInput, 'name' | 'code'>
): string[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const err = error as Record<string, unknown>;

  if (err.code !== '23505') {
    return [];
  }

  if (err.constraint === 'specialty_tenant_name_idx') {
    return [duplicateError(SPECIALTY_NAME_EXISTS, input.name)];
  }

  if (err.constraint === 'specialty_tenant_code_idx' && input.code) {
    return [duplicateError(SPECIALTY_CODE_EXISTS, input.code)];
  }

  return [];
}
