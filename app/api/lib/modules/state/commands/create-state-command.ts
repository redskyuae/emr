import type { CommandResult } from '@/app/api/lib/utils/types';
import { countryRepository } from '../../country/repository/country-repository';
import { stateRepository } from '../repository/state-repository';
import type { State } from '../schemas/state-schema';
import { validateCreateState } from '../validator/create-state-validator';

const CONFLICT_STATUS = 409;
const VALIDATION_STATUS = 400;

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
      errors: ['A state with this name already exists for the selected country'],
      status: CONFLICT_STATUS,
    };
  }

  try {
    const createdState = await stateRepository.createState(validationResult.data);

    if (!createdState) {
      throw new Error('State creation did not return a row');
    }

    return { success: true, data: createdState };
  } catch (error) {
    const err = error as Record<string, unknown>;
    if (err.code === '23505' && err.constraint === 'state_name_country_idx') {
      return {
        success: false,
        errors: ['A state with this name already exists for the selected country'],
        status: CONFLICT_STATUS,
      };
    }
    throw error;
  }
}
