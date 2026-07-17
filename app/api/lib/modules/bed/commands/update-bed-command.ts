import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { bedRepository } from '../repository/bed-repository';
import type { Bed } from '../schemas/bed-schema';
import { getBedNumberUniqueConstraintErrors } from '../validator/bed-number-validator';
import { validateUpdateBed } from '../validator/update-bed-validator';

export async function updateBedCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Bed>> {
  const validationResult = await validateUpdateBed(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const { id: bedId, payload: input, wardName } = validationResult.data;

  try {
    const updatedBed = await bedRepository.updateBed(bedId, { ...input, tenantId });

    if (!updatedBed) {
      return { success: false, errors: ['Bed not found'], status: StatusCodes.NOT_FOUND };
    }

    return { success: true, data: updatedBed };
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
