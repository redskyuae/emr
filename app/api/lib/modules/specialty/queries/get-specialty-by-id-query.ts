import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { specialtyRepository } from '../repository/specialty-repository';
import type { Specialty } from '../schemas/specialty-schema';
import { validateGetSpecialtyById } from '../validator/get-specialty-by-id-validator';

export async function getSpecialtyByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<Specialty>> {
  const validationResult = validateGetSpecialtyById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const specialty = await specialtyRepository.getSpecialtyById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!specialty) {
    return {
      success: false,
      errors: ['Specialty not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: specialty };
}
