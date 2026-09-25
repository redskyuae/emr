'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseApiError } from '@/app/queries/api-error';
import { therapistSkillsBaseKey } from './useTherapistSkills';

export function useDeleteTherapistSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/v1/therapist-skills/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!response.ok) throw await parseApiError(response, 'Could not delete Therapist Skill');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: therapistSkillsBaseKey }),
  });
}
