import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { therapistSkillRepository } from '../repository/therapist-skill-repository';
import type { TherapistSkill } from '../schemas/therapist-skill-schema';
import { validateGetTherapistSkills } from '../validator/get-therapist-skills-validator';

export async function getTherapistSkillsQuery(
  params: Omit<Parameters<typeof validateGetTherapistSkills>[0], never>
): Promise<ListQueryResult<TherapistSkill>> {
  const validation = validateGetTherapistSkills(params);
  if (!validation.success) return validation;
  const { data, total } = await therapistSkillRepository.getTherapistSkills(validation.data);
  return { success: true, data, total };
}
