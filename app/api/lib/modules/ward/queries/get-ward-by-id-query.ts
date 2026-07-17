import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { wardRepository } from '../repository/ward-repository';
import type { Ward } from '../schemas/ward-schema';
import { validateGetWardById } from '../validator/get-ward-by-id-validator';

export async function getWardByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<Ward>> {
  const validationResult = validateGetWardById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const ward = await wardRepository.getWardById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!ward) {
    return {
      success: false,
      errors: ['Ward not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: ward };
}
