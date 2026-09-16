import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { treatmentRepository } from '../repository/treatment-repository';
import type { Treatment } from '../schemas/treatment-schema';
import { validateGetTreatmentById } from '../validator/get-treatment-by-id-validator';

export async function getTreatmentByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<Treatment>> {
  const validationResult = validateGetTreatmentById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const treatment = await treatmentRepository.getTreatmentById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!treatment) {
    return {
      success: false,
      errors: ['Treatment not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: treatment };
}
