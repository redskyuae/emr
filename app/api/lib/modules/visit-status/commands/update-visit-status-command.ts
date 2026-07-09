import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { visitStatusRepository } from '../repository/visit-status-repository';
import type { VisitStatus } from '../schemas/visit-status-schema';
import { validateUpdateVisitStatus } from '../validator/update-visit-status-validator';
import { getVisitStatusUniqueConstraintErrors } from '../validator/visit-status-uniqueness-validator';

export async function updateVisitStatusCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<VisitStatus>> {
  const validationResult = await validateUpdateVisitStatus(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const visitStatusData = { ...validationResult.data.payload, tenantId };

  try {
    const updateResult = await visitStatusRepository.updateVisitStatus(
      validationResult.data.id,
      visitStatusData
    );

    if (updateResult.outcome === 'in-use') {
      return {
        success: false,
        errors: ['Visit status category cannot be changed while the status is in use.'],
        status: StatusCodes.CONFLICT,
      };
    }

    if (updateResult.outcome === 'not-found') {
      return { success: false, errors: ['Visit status not found'], status: StatusCodes.NOT_FOUND };
    }

    return { success: true, data: updateResult.data };
  } catch (error) {
    const constraintErrors = getVisitStatusUniqueConstraintErrors(error, visitStatusData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
