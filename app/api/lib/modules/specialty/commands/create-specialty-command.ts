import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { specialtyRepository } from '../repository/specialty-repository';
import type { Specialty } from '../schemas/specialty-schema';
import { validateCreateSpecialty } from '../validator/create-specialty-validator';
import { getSpecialtyUniqueConstraintErrors } from '../validator/specialty-uniqueness-validator';

export async function createSpecialtyCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Specialty>> {
  const validationResult = await validateCreateSpecialty(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const specialtyData = { ...validationResult.data, tenantId };

  try {
    const createdSpecialty = await specialtyRepository.createSpecialty(specialtyData);
    return { success: true, data: createdSpecialty };
  } catch (error) {
    const constraintErrors = getSpecialtyUniqueConstraintErrors(error, specialtyData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
