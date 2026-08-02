import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import type { Country } from '../schemas/country-schema';
import { countryRepository } from '../repository/country-repository';
import { validateCreateCountry } from '../validator/create-country-validator';
import {
  getCountryUniqueConstraintErrors,
  validateCountryUniqueness,
} from '../validator/country-uniqueness-validator';

export async function createCountryCommand(payload: unknown): Promise<CommandResult<Country>> {
  const validationResult = validateCreateCountry(payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const uniquenessResult = await validateCountryUniqueness(validationResult.data);

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status ?? StatusCodes.CONFLICT,
    };
  }

  try {
    const createdCountry = await countryRepository.createCountry(validationResult.data);
    return { success: true, data: createdCountry };
  } catch (error) {
    const constraintErrors = getCountryUniqueConstraintErrors(error, validationResult.data);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
