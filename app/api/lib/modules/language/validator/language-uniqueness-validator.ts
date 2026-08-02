import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { languageRepository } from '../repository/language-repository';

const LANGUAGE_NAME_EXISTS = 'Language name {value} already exists.';
const LANGUAGE_CODE_EXISTS = 'Language code {value} already exists.';

type LanguageUniquenessInput = {
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateLanguageUniqueness({
  name,
  code,
  excludeId,
}: LanguageUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    languageRepository.findActiveByName(name, { excludeId }),
    languageRepository.findActiveByCode(code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(LANGUAGE_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(LANGUAGE_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getLanguageUniqueConstraintErrors(
  error: unknown,
  input: Pick<LanguageUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'language_name_idx') {
    return [duplicateError(LANGUAGE_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'language_code_idx') {
    return [duplicateError(LANGUAGE_CODE_EXISTS, input.code)];
  }

  return [];
}
