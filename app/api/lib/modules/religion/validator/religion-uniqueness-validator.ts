import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { religionRepository } from '../repository/religion-repository';

const RELIGION_NAME_EXISTS = 'Religion name {value} already exists.';
const RELIGION_CODE_EXISTS = 'Religion code {value} already exists.';

type ReligionUniquenessInput = {
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateReligionUniqueness({
  name,
  code,
  excludeId,
}: ReligionUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    religionRepository.findActiveByName(name, { excludeId }),
    religionRepository.findActiveByCode(code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(RELIGION_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(RELIGION_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getReligionUniqueConstraintErrors(
  error: unknown,
  input: Pick<ReligionUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'religion_name_idx') {
    return [duplicateError(RELIGION_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'religion_code_idx') {
    return [duplicateError(RELIGION_CODE_EXISTS, input.code)];
  }

  return [];
}
