import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { therapistRepository } from '../repository/therapist-repository';
import {
  therapistIdSchema,
  updateTherapistSchema,
  type UpdateTherapistInput,
} from '../schemas/therapist-schema';
import { validateTherapistRegistrationUniqueness } from './therapist-uniqueness-validator';
import { validateTherapistSkillReferences } from './therapist-skill-reference-validator';

export async function validateUpdateTherapist(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<{ id: number; payload: UpdateTherapistInput }>> {
  const idResult = therapistIdSchema.safeParse(id);
  const payloadResult = updateTherapistSchema.safeParse(payload);
  if (!idResult.success || !payloadResult.success) {
    return {
      success: false,
      errors: [
        ...(idResult.success ? [] : [`Therapist ${String(id)} is Invalid.`]),
        ...(payloadResult.success ? [] : formatValidationErrors(payloadResult.error)),
      ],
    };
  }
  if (!(await therapistRepository.getTherapistById(idResult.data, tenantId))) {
    return { success: false, errors: ['Therapist not found'], status: StatusCodes.NOT_FOUND };
  }
  const registration = await validateTherapistRegistrationUniqueness(
    tenantId,
    payloadResult.data.registrationNumber ?? undefined,
    idResult.data
  );
  if (!registration.success) return registration;
  if (payloadResult.data.therapistSkillIds !== undefined) {
    const skills = await validateTherapistSkillReferences(
      payloadResult.data.therapistSkillIds,
      tenantId
    );
    if (!skills.success) return skills;
  }
  return { success: true, data: { id: idResult.data, payload: payloadResult.data } };
}
