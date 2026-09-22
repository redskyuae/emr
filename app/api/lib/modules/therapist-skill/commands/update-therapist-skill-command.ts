import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { therapistSkillRepository } from '../repository/therapist-skill-repository';
import type { TherapistSkill } from '../schemas/therapist-skill-schema';
import { validateUpdateTherapistSkill } from '../validator/update-therapist-skill-validator';
import { getTherapistSkillUniqueConstraintErrors } from '../validator/therapist-skill-uniqueness-validator';

export async function updateTherapistSkillCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<TherapistSkill>> {
  const validation = await validateUpdateTherapistSkill(id, payload, tenantId);
  if (!validation.success) return validation;
  const data = { ...validation.data.payload, tenantId };
  try {
    const updated = await therapistSkillRepository.updateTherapistSkill(validation.data.id, data);
    return updated
      ? { success: true, data: updated }
      : { success: false, errors: ['Therapist Skill not found'], status: StatusCodes.NOT_FOUND };
  } catch (error) {
    const errors = getTherapistSkillUniqueConstraintErrors(error, data);
    if (errors.length > 0) return { success: false, errors, status: StatusCodes.CONFLICT };
    throw error;
  }
}
