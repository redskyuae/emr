import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { bedRepository } from '../../bed/repository/bed-repository';
import { wardRepository } from '../repository/ward-repository';
import { wardIdSchema, wardTenantIdSchema } from '../schemas/ward-schema';

export type DeleteWardInput = {
  id: number;
  tenantId: string;
};

export async function validateDeleteWard(
  id: unknown,
  tenantId: unknown
): Promise<ValidationResult<DeleteWardInput>> {
  const idResult = wardIdSchema.safeParse(id);
  const tenantIdResult = wardTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Ward ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  const existingWard = await wardRepository.getWardById(idResult.data, tenantIdResult.data);

  if (!existingWard) {
    return { success: false, errors: ['Ward not found'], status: StatusCodes.NOT_FOUND };
  }

  // Dangling physical topology breaks the Bed Board: a Ward with Beds cannot go
  // (Room Type precedent — "cannot be removed while in use").
  const bedCount = await bedRepository.countActiveBedsByWardId(tenantIdResult.data, idResult.data);

  if (bedCount > 0) {
    return {
      success: false,
      errors: [`Ward ${existingWard.name} cannot be removed while Beds are assigned to it.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      tenantId: tenantIdResult.data,
    },
  };
}
