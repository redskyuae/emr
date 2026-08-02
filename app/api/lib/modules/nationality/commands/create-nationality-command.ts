import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import type { Nationality } from '../schemas/nationality-schema';
import { nationalityRepository } from '../repository/nationality-repository';
import { validateCreateNationality } from '../validator/create-nationality-validator';
import {
  getNationalityUniqueConstraintErrors,
  validateNationalityUniqueness,
} from '../validator/nationality-uniqueness-validator';

export async function createNationalityCommand(
  payload: unknown
): Promise<CommandResult<Nationality>> {
  const validationResult = validateCreateNationality(payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const uniquenessResult = await validateNationalityUniqueness(validationResult.data);

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status ?? StatusCodes.CONFLICT,
    };
  }

  try {
    const createdNationality = await nationalityRepository.createNationality(validationResult.data);
    return { success: true, data: createdNationality };
  } catch (error) {
    const constraintErrors = getNationalityUniqueConstraintErrors(error, validationResult.data);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
