import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { bedRepository } from '../repository/bed-repository';
import { validateDeleteBed } from '../validator/delete-bed-validator';

export async function deleteBedCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<{ id: number }>> {
  const validationResult = validateDeleteBed(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deleteResult = await bedRepository.deleteBed(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (deleteResult.outcome === 'not-found') {
    return { success: false, errors: ['Bed not found'], status: StatusCodes.NOT_FOUND };
  }

  if (deleteResult.outcome === 'occupied') {
    return {
      success: false,
      errors: [`Bed ${deleteResult.bedNumber} cannot be removed while occupied.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: deleteResult.data };
}
