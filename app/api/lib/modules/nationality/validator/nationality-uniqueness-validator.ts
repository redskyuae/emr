import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { nationalityRepository } from '../repository/nationality-repository';

const NATIONALITY_NAME_EXISTS = 'Nationality name {value} already exists.';
const NATIONALITY_CODE_EXISTS = 'Nationality code {value} already exists.';

type NationalityUniquenessInput = {
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateNationalityUniqueness({
  name,
  code,
  excludeId,
}: NationalityUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    nationalityRepository.findActiveByName(name, { excludeId }),
    nationalityRepository.findActiveByCode(code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(NATIONALITY_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(NATIONALITY_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getNationalityUniqueConstraintErrors(
  error: unknown,
  input: Pick<NationalityUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'nationality_name_idx') {
    return [duplicateError(NATIONALITY_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'nationality_code_idx') {
    return [duplicateError(NATIONALITY_CODE_EXISTS, input.code)];
  }

  return [];
}
