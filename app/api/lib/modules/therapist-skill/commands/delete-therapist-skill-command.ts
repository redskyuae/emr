import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { therapistSkillRepository } from '../repository/therapist-skill-repository';
import type { TherapistSkill } from '../schemas/therapist-skill-schema';
import { validateDeleteTherapistSkill } from '../validator/delete-therapist-skill-validator';

export async function deleteTherapistSkillCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<TherapistSkill>> {
  const validation = await validateDeleteTherapistSkill(id, tenantId);
  if (!validation.success) return validation;
  const deleted = await therapistSkillRepository.deleteTherapistSkill(
    validation.data.id,
    validation.data.tenantId
  );
  return deleted
    ? { success: true, data: deleted }
    : { success: false, errors: ['Therapist Skill not found'], status: StatusCodes.NOT_FOUND };
}
