import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateDeleteVisit } from '../validator/delete-visit-validator';

export async function deleteVisitCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<Visit>> {
  const validationResult = validateDeleteVisit(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const result = await visitRepository.deleteVisit(
    validationResult.data.id,
    validationResult.data.tenantId
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

  return { success: true, data: result.data };
}
