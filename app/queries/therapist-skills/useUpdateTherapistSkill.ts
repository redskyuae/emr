'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseApiError } from '@/app/queries/api-error';
import type { SaveTherapistSkillRequest } from '@/app/api/v1/therapist-skills/types';
import type { UpdateTherapistSkillResponse } from '@/app/api/v1/therapist-skills/[id]/types';
import { therapistSkillsBaseKey } from './useTherapistSkills';

type UpdateTherapistSkillVariables = { id: number; request: SaveTherapistSkillRequest };

export function useUpdateTherapistSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, request }: UpdateTherapistSkillVariables) => {
      const response = await fetch(`/api/v1/therapist-skills/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(request),
      });
      if (!response.ok) throw await parseApiError(response, 'Could not update Therapist Skill');
      return response.json() as Promise<UpdateTherapistSkillResponse>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: therapistSkillsBaseKey }),
  });
}
