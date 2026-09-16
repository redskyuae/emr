import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { treatmentRepository } from '../repository/treatment-repository';
import type { Treatment } from '../schemas/treatment-schema';
import { validateUpdateTreatment } from '../validator/update-treatment-validator';
import { getTreatmentUniqueConstraintErrors } from '../validator/treatment-uniqueness-validator';

export async function updateTreatmentCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Treatment>> {
  const validationResult = await validateUpdateTreatment(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const treatmentData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedTreatment = await treatmentRepository.updateTreatment(
      validationResult.data.id,
      treatmentData
    );

    if (!updatedTreatment) {
      return {
        success: false,
        errors: ['Treatment not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedTreatment };
  } catch (error) {
    const constraintErrors = getTreatmentUniqueConstraintErrors(error, treatmentData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
