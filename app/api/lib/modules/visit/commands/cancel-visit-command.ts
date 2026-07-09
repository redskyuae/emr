import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { VisitStatusConflictError } from '../errors/visit-status-conflict-error';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateCancelVisit } from '../validator/cancel-visit-validator';

export async function cancelVisitCommand(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Visit>> {
  const validationResult = await validateCancelVisit(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const updatedVisit = await visitRepository.updateVisitStatusTransition(
      validationResult.data.id,
      tenantId,
      {
        statusId: validationResult.data.statusId,
        expectedStatusId: validationResult.data.expectedStatusId,
        timestampField: 'cancelledOn',
        cancelledReason: validationResult.data.cancelledReason,
      }
    );

    if (!updatedVisit) {
      return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
    }

    return { success: true, data: updatedVisit };
  } catch (error) {
    if (error instanceof VisitStatusConflictError) {
      return { success: false, errors: [error.message], status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
