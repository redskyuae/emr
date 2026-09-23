import type { TherapistSkill } from '@/app/api/lib/modules/therapist-skill/schemas/therapist-skill-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListTherapistSkillsResponse = Paginated<TherapistSkill>;
export type TherapistSkillResponse = { data: TherapistSkill };
export type SaveTherapistSkillRequest = {
  name: string;
  code?: string | null;
  description?: string | null;
};
export type SaveTherapistSkillResponse = TherapistSkillResponse;
