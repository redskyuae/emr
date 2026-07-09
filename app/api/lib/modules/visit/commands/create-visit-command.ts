import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { OpenVisitConflictError } from '../errors/open-visit-conflict-error';
import { PatientInactiveConflictError } from '../errors/patient-inactive-conflict-error';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateCreateVisit } from '../validator/create-visit-validator';

export async function createVisitCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Visit>> {
  const validationResult = await validateCreateVisit(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const createdVisit = await visitRepository.createVisit({ ...validationResult.data, tenantId });

    return { success: true, data: createdVisit };
  } catch (error) {
    if (error instanceof OpenVisitConflictError || error instanceof PatientInactiveConflictError) {
      return { success: false, errors: [error.message], status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
