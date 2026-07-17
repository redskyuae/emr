import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateCancelVisit } from '../validator/cancel-visit-validator';

export async function cancelVisitCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Visit>> {
  const validationResult = validateCancelVisit(id, payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const result = await visitRepository.cancelVisit(
    validationResult.data.id,
    tenantId,
    validationResult.data.payload.cancellationReason
  );

  if (result.outcome === 'not-found') {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  if (result.outcome === 'appointment-status-not-configured') {
    return {
      success: false,
      errors: ['Scheduled appointment status is not configured.'],
      status: StatusCodes.CONFLICT,
    };
  }

  if (result.outcome === 'invalid-status') {
    return {
      success: false,
      errors: [`Visit ${result.data.visitNumber} cannot be cancelled from its current status.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: result.data };
}
