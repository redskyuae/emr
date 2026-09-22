import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { therapistSkillRepository } from '../repository/therapist-skill-repository';
import type { TherapistSkill } from '../schemas/therapist-skill-schema';
import { validateGetTherapistSkillById } from '../validator/get-therapist-skill-by-id-validator';

export async function getTherapistSkillByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<TherapistSkill>> {
  const validation = validateGetTherapistSkillById(id, tenantId);
  if (!validation.success) return validation;
  const skill = await therapistSkillRepository.getTherapistSkillById(
    validation.data.id,
    validation.data.tenantId
  );
  return skill
    ? { success: true, data: skill }
    : { success: false, errors: ['Therapist Skill not found'], status: StatusCodes.NOT_FOUND };
}
