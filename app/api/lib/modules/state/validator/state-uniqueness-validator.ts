import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { stateRepository } from '../repository/state-repository';

const STATE_NAME_EXISTS = 'State name {value} already exists for the selected country.';

type StateUniquenessInput = {
  name: string;
  countryId: number;
  excludeId?: number;
};

function duplicateError(value: string) {
  return STATE_NAME_EXISTS.replace('{value}', value);
}

export async function validateStateUniqueness({
  name,
  countryId,
  excludeId,
}: StateUniquenessInput): Promise<ValidationResult<void>> {
  const existingState = await stateRepository.findActiveByNameAndCountry(name, countryId, {
    excludeId,
  });

  if (existingState) {
    return {
      success: false,
      errors: [duplicateError(name)],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: undefined };
}

export function getStateUniqueConstraintErrors(
  error: unknown,
  input: Pick<StateUniquenessInput, 'name'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'state_name_country_idx') {
    return [duplicateError(input.name)];
  }

  return [];
}
