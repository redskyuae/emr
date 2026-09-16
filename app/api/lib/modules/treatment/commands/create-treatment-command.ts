import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { treatmentRepository } from '../repository/treatment-repository';
import type { Treatment } from '../schemas/treatment-schema';
import { validateCreateTreatment } from '../validator/create-treatment-validator';
import { getTreatmentUniqueConstraintErrors } from '../validator/treatment-uniqueness-validator';

export async function createTreatmentCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Treatment>> {
  const validationResult = await validateCreateTreatment(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const treatmentData = { ...validationResult.data, tenantId };

  try {
    const createdTreatment = await treatmentRepository.createTreatment(treatmentData);
    return { success: true, data: createdTreatment };
  } catch (error) {
    const constraintErrors = getTreatmentUniqueConstraintErrors(error, treatmentData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
