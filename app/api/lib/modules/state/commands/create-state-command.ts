import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { countryRepository } from '../../country/repository/country-repository';
import { stateRepository } from '../repository/state-repository';
import type { State } from '../schemas/state-schema';
import { validateCreateState } from '../validator/create-state-validator';
import {
  getStateUniqueConstraintErrors,
  validateStateUniqueness,
} from '../validator/state-uniqueness-validator';

export async function createStateCommand(payload: unknown): Promise<CommandResult<State>> {
  const validationResult = validateCreateState(payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const country = await countryRepository.getCountryById(validationResult.data.countryId);

  if (!country) {
    return {
      success: false,
      errors: ['countryId: Country not found'],
      status: StatusCodes.BAD_REQUEST,
    };
  }

  const uniquenessResult = await validateStateUniqueness(validationResult.data);

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status ?? StatusCodes.CONFLICT,
    };
  }

  try {
    const createdState = await stateRepository.createState(validationResult.data);

    if (!createdState) {
      return {
        success: false,
        errors: ['State creation did not return a row'],
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }

    return { success: true, data: createdState };
  } catch (error) {
    const constraintErrors = getStateUniqueConstraintErrors(error, validationResult.data);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
