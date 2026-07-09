import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { VisitStatusConflictError } from '../errors/visit-status-conflict-error';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateUpdateVisit } from '../validator/update-visit-validator';

export async function updateVisitCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Visit>> {
  const validationResult = await validateUpdateVisit(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const updatedVisit = await visitRepository.updateVisit(validationResult.data.id, {
      ...validationResult.data.payload,
      tenantId,
      expectedStatusId: validationResult.data.expectedStatusId,
    });

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
