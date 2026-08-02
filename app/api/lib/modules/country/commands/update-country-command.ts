import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import type { Country } from '../schemas/country-schema';
import { countryRepository } from '../repository/country-repository';
import { validateCountryId } from '../validator/country-id-validator';
import { validateUpdateCountry } from '../validator/update-country-validator';
import {
  getCountryUniqueConstraintErrors,
  validateCountryUniqueness,
} from '../validator/country-uniqueness-validator';

export async function updateCountryCommand(
  id: unknown,
  payload: unknown
): Promise<CommandResult<Country>> {
  const idValidationResult = validateCountryId(id);
  const payloadValidationResult = validateUpdateCountry(payload);

  if (!idValidationResult.success) {
    return { success: false, errors: idValidationResult.errors };
  }

  if (!payloadValidationResult.success) {
    return { success: false, errors: payloadValidationResult.errors };
  }

  const existingCountry = await countryRepository.getCountryById(idValidationResult.data);

  if (!existingCountry) {
    return {
      success: false,
      errors: ['Country not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateCountryUniqueness({
    ...payloadValidationResult.data,
    excludeId: idValidationResult.data,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status ?? StatusCodes.CONFLICT,
    };
  }

  try {
    const updatedCountry = await countryRepository.updateCountry(
      idValidationResult.data,
      payloadValidationResult.data
    );

    if (!updatedCountry) {
      return {
        success: false,
        errors: ['Country not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedCountry };
  } catch (error) {
    const constraintErrors = getCountryUniqueConstraintErrors(error, payloadValidationResult.data);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
