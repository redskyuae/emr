import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { therapistSkillRepository } from '../repository/therapist-skill-repository';
import {
  therapistSkillIdSchema,
  updateTherapistSkillSchema,
  type UpdateTherapistSkillInput,
} from '../schemas/therapist-skill-schema';
import { validateTherapistSkillUniqueness } from './therapist-skill-uniqueness-validator';

export async function validateUpdateTherapistSkill(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<{ id: number; payload: UpdateTherapistSkillInput }>> {
  const idResult = therapistSkillIdSchema.safeParse(id);
  const payloadResult = updateTherapistSkillSchema.safeParse(payload);
  if (!idResult.success || !payloadResult.success) {
    return {
      success: false,
      errors: [
        ...(idResult.success ? [] : [`Therapist Skill ${String(id)} is Invalid.`]),
        ...(payloadResult.success ? [] : formatValidationErrors(payloadResult.error)),
      ],
    };
  }

  if (!(await therapistSkillRepository.getTherapistSkillById(idResult.data, tenantId))) {
    return { success: false, errors: ['Therapist Skill not found'], status: StatusCodes.NOT_FOUND };
  }
  const uniqueness = await validateTherapistSkillUniqueness({
    ...payloadResult.data,
    tenantId,
    excludeId: idResult.data,
  });
  if (!uniqueness.success) {
    return { success: false, errors: uniqueness.errors, status: uniqueness.status };
  }
  return { success: true, data: { id: idResult.data, payload: payloadResult.data } };
}
