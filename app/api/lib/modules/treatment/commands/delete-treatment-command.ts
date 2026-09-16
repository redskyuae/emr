import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { treatmentRepository } from '../repository/treatment-repository';
import type { Treatment } from '../schemas/treatment-schema';
import { validateDeleteTreatment } from '../validator/delete-treatment-validator';

export async function deleteTreatmentCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<Treatment>> {
  const validationResult = validateDeleteTreatment(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deletedTreatment = await treatmentRepository.deleteTreatment(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedTreatment) {
    return {
      success: false,
      errors: ['Treatment not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedTreatment };
}
