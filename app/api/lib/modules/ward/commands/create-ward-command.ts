import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { wardRepository } from '../repository/ward-repository';
import type { Ward } from '../schemas/ward-schema';
import { validateCreateWard } from '../validator/create-ward-validator';
import { getWardUniqueConstraintErrors } from '../validator/ward-uniqueness-validator';

export async function createWardCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Ward>> {
  const validationResult = await validateCreateWard(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const wardData = { ...validationResult.data, tenantId };

  try {
    const createdWard = await wardRepository.createWard(wardData);
    return { success: true, data: createdWard };
  } catch (error) {
    const constraintErrors = getWardUniqueConstraintErrors(error, wardData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
