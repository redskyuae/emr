import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { bedRepository } from '../repository/bed-repository';
import type { Bed } from '../schemas/bed-schema';
import { getBedNumberUniqueConstraintErrors } from '../validator/bed-number-validator';
import { validateCreateBed } from '../validator/create-bed-validator';

export async function createBedCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Bed>> {
  const validationResult = await validateCreateBed(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const { input, wardName } = validationResult.data;

  try {
    const createdBed = await bedRepository.createBed({ ...input, tenantId });

    if (!createdBed) {
      return { success: false, errors: ['Created Bed could not be read'] };
    }

    return { success: true, data: createdBed };
  } catch (error) {
    const constraintErrors = getBedNumberUniqueConstraintErrors(error, {
      bedNumber: input.bedNumber,
      wardName,
    });

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
