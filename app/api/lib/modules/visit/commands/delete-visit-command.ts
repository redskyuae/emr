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

  const deletedVisit = await visitRepository.deleteVisit(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedVisit) {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: deletedVisit };
}
