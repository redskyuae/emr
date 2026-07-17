import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { bedRepository } from '../repository/bed-repository';
import type { Bed } from '../schemas/bed-schema';
import { validateGetBedById } from '../validator/get-bed-by-id-validator';

export async function getBedByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<Bed>> {
  const validationResult = validateGetBedById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const bed = await bedRepository.getBedById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!bed) {
    return { success: false, errors: ['Bed not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: bed };
}
