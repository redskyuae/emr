import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { visitTypeRepository } from '../repository/visit-type-repository';
import type { VisitType } from '../schemas/visit-type-schema';
import { validateUpdateVisitType } from '../validator/update-visit-type-validator';
import { getVisitTypeUniqueConstraintErrors } from '../validator/visit-type-uniqueness-validator';

export async function updateVisitTypeCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<VisitType>> {
  const validationResult = await validateUpdateVisitType(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const visitTypeData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedVisitType = await visitTypeRepository.updateVisitType(
      validationResult.data.id,
      visitTypeData
    );

    if (!updatedVisitType) {
      return {
        success: false,
        errors: ['Visit type not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedVisitType };
  } catch (error) {
    const constraintErrors = getVisitTypeUniqueConstraintErrors(error, visitTypeData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
