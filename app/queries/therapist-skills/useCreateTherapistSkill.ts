'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveTherapistSkillRequest,
  SaveTherapistSkillResponse,
} from '@/app/api/v1/therapist-skills/types';
import { therapistSkillsBaseKey } from './useTherapistSkills';

export function useCreateTherapistSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: SaveTherapistSkillRequest) => {
      const response = await fetch('/api/v1/therapist-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(request),
      });
      if (!response.ok) throw await parseApiError(response, 'Could not create Therapist Skill');
      return response.json() as Promise<SaveTherapistSkillResponse>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: therapistSkillsBaseKey }),
  });
}
