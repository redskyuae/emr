import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import type { Religion } from '../schemas/religion-schema';
import { religionRepository } from '../repository/religion-repository';
import { validateReligionId } from '../validator/religion-id-validator';
import { validateUpdateReligion } from '../validator/update-religion-validator';
import {
  getReligionUniqueConstraintErrors,
  validateReligionUniqueness,
} from '../validator/religion-uniqueness-validator';

export async function updateReligionCommand(
  id: unknown,
  payload: unknown
): Promise<CommandResult<Religion>> {
  const idValidationResult = validateReligionId(id);
  const payloadValidationResult = validateUpdateReligion(payload);

  if (!idValidationResult.success) {
    return { success: false, errors: idValidationResult.errors };
  }

  if (!payloadValidationResult.success) {
    return { success: false, errors: payloadValidationResult.errors };
  }

  const existingReligion = await religionRepository.getReligionById(idValidationResult.data);

  if (!existingReligion) {
    return {
      success: false,
      errors: ['Religion not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateReligionUniqueness({
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
    const updatedReligion = await religionRepository.updateReligion(
      idValidationResult.data,
      payloadValidationResult.data
    );

    if (!updatedReligion) {
      return {
        success: false,
        errors: ['Religion not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedReligion };
  } catch (error) {
    const constraintErrors = getReligionUniqueConstraintErrors(error, payloadValidationResult.data);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
