import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { therapistRepository } from '../repository/therapist-repository';
import type { Therapist } from '../schemas/therapist-schema';
import { validateGetTherapistById } from '../validator/get-therapist-by-id-validator';

export async function getTherapistByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<Therapist>> {
  const validation = validateGetTherapistById(id, tenantId);
  if (!validation.success) return validation;
  const therapist = await therapistRepository.getTherapistById(
    validation.data.id,
    validation.data.tenantId
  );
  return therapist
    ? { success: true, data: therapist }
    : { success: false, errors: ['Therapist not found'], status: StatusCodes.NOT_FOUND };
}
