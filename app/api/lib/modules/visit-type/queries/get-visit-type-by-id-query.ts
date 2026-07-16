import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { visitTypeRepository } from '../repository/visit-type-repository';
import type { VisitType } from '../schemas/visit-type-schema';
import { validateGetVisitTypeById } from '../validator/get-visit-type-by-id-validator';

export async function getVisitTypeByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<VisitType>> {
  const validationResult = validateGetVisitTypeById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const visitType = await visitTypeRepository.getVisitTypeById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!visitType) {
    return {
      success: false,
      errors: ['Visit type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: visitType };
}
