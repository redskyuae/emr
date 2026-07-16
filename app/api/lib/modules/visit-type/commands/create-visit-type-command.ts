import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { visitTypeRepository } from '../repository/visit-type-repository';
import type { VisitType } from '../schemas/visit-type-schema';
import { validateCreateVisitType } from '../validator/create-visit-type-validator';
import { getVisitTypeUniqueConstraintErrors } from '../validator/visit-type-uniqueness-validator';

export async function createVisitTypeCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<VisitType>> {
  const validationResult = await validateCreateVisitType(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const visitTypeData = { ...validationResult.data, tenantId };

  try {
    const createdVisitType = await visitTypeRepository.createVisitType(visitTypeData);
    return { success: true, data: createdVisitType };
  } catch (error) {
    const constraintErrors = getVisitTypeUniqueConstraintErrors(error, visitTypeData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
