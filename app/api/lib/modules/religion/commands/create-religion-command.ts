import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import type { Religion } from '../schemas/religion-schema';
import { religionRepository } from '../repository/religion-repository';
import { validateCreateReligion } from '../validator/create-religion-validator';
import {
  getReligionUniqueConstraintErrors,
  validateReligionUniqueness,
} from '../validator/religion-uniqueness-validator';

export async function createReligionCommand(payload: unknown): Promise<CommandResult<Religion>> {
  const validationResult = validateCreateReligion(payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const uniquenessResult = await validateReligionUniqueness(validationResult.data);

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status ?? StatusCodes.CONFLICT,
    };
  }

  try {
    const createdReligion = await religionRepository.createReligion(validationResult.data);
    return { success: true, data: createdReligion };
  } catch (error) {
    const constraintErrors = getReligionUniqueConstraintErrors(error, validationResult.data);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
