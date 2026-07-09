import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { visitStatusRepository } from '../repository/visit-status-repository';
import type { VisitStatus } from '../schemas/visit-status-schema';
import { validateDeleteVisitStatus } from '../validator/delete-visit-status-validator';

export async function deleteVisitStatusCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<VisitStatus>> {
  const validationResult = await validateDeleteVisitStatus(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deleteResult = await visitStatusRepository.deleteVisitStatus(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (deleteResult.outcome === 'in-use') {
    return {
      success: false,
      errors: ['Visit status cannot be deleted while it is in use.'],
      status: StatusCodes.CONFLICT,
    };
  }

  if (deleteResult.outcome === 'not-found') {
    return { success: false, errors: ['Visit status not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: deleteResult.data };
}
