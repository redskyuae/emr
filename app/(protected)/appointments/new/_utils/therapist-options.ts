import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';

export function getTherapistsForSkill(
  therapists: Therapist[],
  requiredSkill: { id: number | null; name: string } | null
) {
  if (!requiredSkill) return [];

  const activeTherapists = therapists.filter((therapist) => therapist.isActive);
  if (requiredSkill.id === null) return activeTherapists;

  return activeTherapists.filter((therapist) =>
    therapist.skills.some((skill) => skill.id === requiredSkill.id)
  );
}
