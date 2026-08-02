import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { countryRepository } from '../repository/country-repository';

const COUNTRY_NAME_EXISTS = 'Country name {value} already exists.';
const COUNTRY_CODE_EXISTS = 'Country code {value} already exists.';

type CountryUniquenessInput = {
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateCountryUniqueness({
  name,
  code,
  excludeId,
}: CountryUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    countryRepository.findActiveByName(name, { excludeId }),
    countryRepository.findActiveByCode(code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(COUNTRY_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(COUNTRY_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getCountryUniqueConstraintErrors(
  error: unknown,
  input: Pick<CountryUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'country_name_idx') {
    return [duplicateError(COUNTRY_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'country_code_idx') {
    return [duplicateError(COUNTRY_CODE_EXISTS, input.code)];
  }

  return [];
}
