import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import type { Nationality } from '../schemas/nationality-schema';
import { nationalityRepository } from '../repository/nationality-repository';
import { validateNationalityId } from '../validator/nationality-id-validator';
import { validateUpdateNationality } from '../validator/update-nationality-validator';
import {
  getNationalityUniqueConstraintErrors,
  validateNationalityUniqueness,
} from '../validator/nationality-uniqueness-validator';

export async function updateNationalityCommand(
  id: unknown,
  payload: unknown
): Promise<CommandResult<Nationality>> {
  const idValidationResult = validateNationalityId(id);
  const payloadValidationResult = validateUpdateNationality(payload);

  if (!idValidationResult.success) {
    return { success: false, errors: idValidationResult.errors };
  }

  if (!payloadValidationResult.success) {
    return { success: false, errors: payloadValidationResult.errors };
  }

  const existingNationality = await nationalityRepository.getNationalityById(
    idValidationResult.data
  );

  if (!existingNationality) {
    return {
      success: false,
      errors: ['Nationality not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateNationalityUniqueness({
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
    const updatedNationality = await nationalityRepository.updateNationality(
      idValidationResult.data,
      payloadValidationResult.data
    );

    if (!updatedNationality) {
      return {
        success: false,
        errors: ['Nationality not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedNationality };
  } catch (error) {
    const constraintErrors = getNationalityUniqueConstraintErrors(
      error,
      payloadValidationResult.data
    );

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
