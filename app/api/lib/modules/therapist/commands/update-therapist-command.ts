import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { therapistRepository } from '../repository/therapist-repository';
import type { Therapist } from '../schemas/therapist-schema';
import { validateUpdateTherapist } from '../validator/update-therapist-validator';
import { getTherapistUniqueConstraintErrors } from '../validator/therapist-uniqueness-validator';

export async function updateTherapistCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Therapist>> {
  const validation = await validateUpdateTherapist(id, payload, tenantId);
  if (!validation.success) return validation;
  try {
    const updated = await therapistRepository.updateTherapist(validation.data.id, {
      ...validation.data.payload,
      tenantId,
    });
    return updated
      ? { success: true, data: updated }
      : { success: false, errors: ['Therapist not found'], status: StatusCodes.NOT_FOUND };
  } catch (error) {
    const errors = getTherapistUniqueConstraintErrors(
      error,
      validation.data.payload.registrationNumber ?? undefined
    );
    if (errors.length > 0) return { success: false, errors, status: StatusCodes.CONFLICT };
    throw error;
  }
}
