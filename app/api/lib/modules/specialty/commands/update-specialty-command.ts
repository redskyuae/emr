import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { specialtyRepository } from '../repository/specialty-repository';
import type { Specialty } from '../schemas/specialty-schema';
import { getSpecialtyUniqueConstraintErrors } from '../validator/specialty-uniqueness-validator';
import { validateUpdateSpecialty } from '../validator/update-specialty-validator';

export async function updateSpecialtyCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Specialty>> {
  const validationResult = await validateUpdateSpecialty(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const specialtyData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedSpecialty = await specialtyRepository.updateSpecialty(
      validationResult.data.id,
      specialtyData
    );

    if (!updatedSpecialty) {
      return {
        success: false,
        errors: ['Specialty not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedSpecialty };
  } catch (error) {
    const constraintErrors = getSpecialtyUniqueConstraintErrors(error, specialtyData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
