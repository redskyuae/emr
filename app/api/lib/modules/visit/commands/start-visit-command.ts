import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateStartVisit } from '../validator/start-visit-validator';

export async function startVisitCommand(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Visit>> {
  const validationResult = await validateStartVisit(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const updatedVisit = await visitRepository.updateVisitStatusTransition(
    validationResult.data.id,
    tenantId,
    { statusId: validationResult.data.statusId, timestampField: 'startedOn' }
  );

  if (!updatedVisit) {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: updatedVisit };
}
