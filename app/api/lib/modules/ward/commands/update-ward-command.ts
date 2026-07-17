import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { wardRepository } from '../repository/ward-repository';
import type { Ward } from '../schemas/ward-schema';
import { validateUpdateWard } from '../validator/update-ward-validator';
import { getWardUniqueConstraintErrors } from '../validator/ward-uniqueness-validator';

export async function updateWardCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Ward>> {
  const validationResult = await validateUpdateWard(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const wardData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedWard = await wardRepository.updateWard(validationResult.data.id, wardData);

    if (!updatedWard) {
      return {
        success: false,
        errors: ['Ward not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedWard };
  } catch (error) {
    const constraintErrors = getWardUniqueConstraintErrors(error, wardData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
