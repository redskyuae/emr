import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { visitStatusRepository } from '../repository/visit-status-repository';
import type { VisitStatus } from '../schemas/visit-status-schema';
import { validateCreateVisitStatus } from '../validator/create-visit-status-validator';
import { getVisitStatusUniqueConstraintErrors } from '../validator/visit-status-uniqueness-validator';

export async function createVisitStatusCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<VisitStatus>> {
  const validationResult = await validateCreateVisitStatus(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const visitStatusData = { ...validationResult.data, tenantId };

  try {
    const createdVisitStatus = await visitStatusRepository.createVisitStatus(visitStatusData);
    return { success: true, data: createdVisitStatus };
  } catch (error) {
    const constraintErrors = getVisitStatusUniqueConstraintErrors(error, visitStatusData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
