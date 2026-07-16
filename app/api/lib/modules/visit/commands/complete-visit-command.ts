import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateGetVisitById } from '../validator/get-visit-by-id-validator';

export async function completeVisitCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<Visit>> {
  const validationResult = validateGetVisitById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const result = await visitRepository.completeVisit(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (result.outcome === 'not-found') {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  if (result.outcome === 'appointment-status-not-configured') {
    return {
      success: false,
      errors: ['Completed appointment status is not configured.'],
      status: StatusCodes.CONFLICT,
    };
  }

  if (result.outcome === 'invalid-status') {
    return {
      success: false,
      errors: [`Visit ${result.data.visitNumber} cannot be completed from its current status.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: result.data };
}
