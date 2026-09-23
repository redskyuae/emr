import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { therapistRepository } from '../repository/therapist-repository';
import { therapistIdSchema, therapistTenantIdSchema } from '../schemas/therapist-schema';

export async function validateTherapistExists(
  id: unknown,
  tenantId: unknown
): Promise<ValidationResult<{ id: number; tenantId: string }>> {
  const idResult = therapistIdSchema.safeParse(id);
  const tenantResult = therapistTenantIdSchema.safeParse(tenantId);
  if (!idResult.success || !tenantResult.success) {
    return { success: false, errors: [`Therapist ${String(id)} is Invalid.`] };
  }
  const therapist = await therapistRepository.getTherapistById(idResult.data, tenantResult.data);
  return therapist
    ? { success: true, data: { id: idResult.data, tenantId: tenantResult.data } }
    : { success: false, errors: ['Therapist not found'], status: StatusCodes.NOT_FOUND };
}
