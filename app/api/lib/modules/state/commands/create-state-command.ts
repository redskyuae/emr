import type { CommandResult } from '@/app/api/lib/utils/types';
import { countryRepository } from '../../country/repository/country-repository';
import { stateRepository } from '../repository/state-repository';
import type { State } from '../schemas/state-schema';
import { validateCreateState } from '../validator/create-state-validator';

const CONFLICT_STATUS = 409;
const INTERNAL_ERROR_STATUS = 500;
const VALIDATION_STATUS = 400;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;

    if (typeof err.message === 'string' && err.message.length > 0) {
      return err.message;
    }

    if (typeof err.detail === 'string' && err.detail.length > 0) {
      return err.detail;
    }
  }

  return 'Internal error while creating State';
}

export async function createStateCommand(payload: unknown): Promise<CommandResult<State>> {
  const validationResult = validateCreateState(payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  try {
    const country = await countryRepository.getCountryById(validationResult.data.countryId);

    if (!country) {
      return {
        success: false,
        errors: ['countryId: Country not found'],
        status: VALIDATION_STATUS,
      };
    }

    const existingState = await stateRepository.findActiveByNameAndCountry(
      validationResult.data.name,
      validationResult.data.countryId
    );

    if (existingState) {
      return {
        success: false,
        errors: [
          `State name ${validationResult.data.name} already exists for the selected country.`,
        ],
        status: CONFLICT_STATUS,
      };
    }

    const createdState = await stateRepository.createState(validationResult.data);

    if (!createdState) {
      return {
        success: false,
        errors: ['State creation did not return a row'],
        status: INTERNAL_ERROR_STATUS,
      };
    }

    return { success: true, data: createdState };
  } catch (error) {
    const err = error as Record<string, unknown>;
    if (err.code === '23505' && err.constraint === 'state_name_country_idx') {
      return {
        success: false,
        errors: [
          `State name ${validationResult.data.name} already exists for the selected country.`,
        ],
        status: CONFLICT_STATUS,
      };
    }

    return {
      success: false,
      errors: [getErrorMessage(error)],
      status: INTERNAL_ERROR_STATUS,
    };
  }
}
