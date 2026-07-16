import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { visitTypeRepository } from '../repository/visit-type-repository';
import type { VisitType } from '../schemas/visit-type-schema';
import { validateDeleteVisitType } from '../validator/delete-visit-type-validator';

export async function deleteVisitTypeCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<VisitType>> {
  const validationResult = validateDeleteVisitType(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deletedVisitType = await visitTypeRepository.deleteVisitType(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedVisitType) {
    return {
      success: false,
      errors: ['Visit type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedVisitType };
}
