import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
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
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const updatedVisit = await visitRepository.updateVisit(
    validationResult.data.id,
    tenantId,
    validationResult.data.payload
  );

  if (!updatedVisit) {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: updatedVisit };
}
