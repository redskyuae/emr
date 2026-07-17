import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { wardRepository } from '../repository/ward-repository';
import type { Ward } from '../schemas/ward-schema';
import { validateDeleteWard } from '../validator/delete-ward-validator';

export async function deleteWardCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<Ward>> {
  const validationResult = await validateDeleteWard(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deletedWard = await wardRepository.deleteWard(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedWard) {
    return {
      success: false,
      errors: ['Ward not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedWard };
}
