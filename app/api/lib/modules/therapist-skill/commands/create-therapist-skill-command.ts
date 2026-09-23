import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { therapistSkillRepository } from '../repository/therapist-skill-repository';
import type { TherapistSkill } from '../schemas/therapist-skill-schema';
import { validateCreateTherapistSkill } from '../validator/create-therapist-skill-validator';
import { getTherapistSkillUniqueConstraintErrors } from '../validator/therapist-skill-uniqueness-validator';

export async function createTherapistSkillCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<TherapistSkill>> {
  const validation = await validateCreateTherapistSkill(payload, tenantId);
  if (!validation.success) return validation;
  const data = { ...validation.data, tenantId };
  try {
    return { success: true, data: await therapistSkillRepository.createTherapistSkill(data) };
  } catch (error) {
    const errors = getTherapistSkillUniqueConstraintErrors(error, data);
    if (errors.length > 0) return { success: false, errors, status: StatusCodes.CONFLICT };
    throw error;
  }
}
