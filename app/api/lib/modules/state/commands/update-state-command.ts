import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { countryRepository } from '../../country/repository/country-repository';
import { stateRepository } from '../repository/state-repository';
import type { State } from '../schemas/state-schema';
import { validateStateId } from '../validator/state-id-validator';
import { validateUpdateState } from '../validator/update-state-validator';

export async function updateStateCommand(
  id: unknown,
  payload: unknown
): Promise<CommandResult<State>> {
  const idValidationResult = validateStateId(id);
  const payloadValidationResult = validateUpdateState(payload);

  if (!idValidationResult.success) {
    return { success: false, errors: idValidationResult.errors };
  }

  if (!payloadValidationResult.success) {
    return { success: false, errors: payloadValidationResult.errors };
  }

  const [existingState, country] = await Promise.all([
    stateRepository.getStateById(idValidationResult.data),
    countryRepository.getCountryById(payloadValidationResult.data.countryId),
  ]);

  if (!existingState) {
    return {
      success: false,
      errors: ['State not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  if (!country) {
    return {
      success: false,
      errors: ['countryId: Country not found'],
      status: StatusCodes.BAD_REQUEST,
    };
  }

  const duplicateState = await stateRepository.findActiveByNameAndCountry(
    payloadValidationResult.data.name,
    payloadValidationResult.data.countryId,
    { excludeId: idValidationResult.data }
  );

  if (duplicateState) {
    return {
      success: false,
      errors: [
        `State name ${payloadValidationResult.data.name} already exists for the selected country.`,
      ],
      status: StatusCodes.CONFLICT,
    };
  }

  try {
    const updatedState = await stateRepository.updateState(
      idValidationResult.data,
      payloadValidationResult.data
    );

    if (!updatedState) {
      return {
        success: false,
        errors: ['State not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedState };
  } catch (error) {
    const err = error as Record<string, unknown>;
    if (err.code === '23505' && err.constraint === 'state_name_country_idx') {
      return {
        success: false,
        errors: [
          `State name ${payloadValidationResult.data.name} already exists for the selected country.`,
        ],
        status: StatusCodes.CONFLICT,
      };
    }
    throw error;
  }
}
