'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateReligionRequest,
  UpdateReligionResponse,
} from '@/app/api/v1/religions/[id]/types';
import { religionQueryKey } from './useReligion';
import { RELIGIONS_KEY } from './useReligions';

export type UpdateReligionVariables = {
  id: number;
  request: UpdateReligionRequest;
};

async function updateReligion({
  id,
  request,
}: UpdateReligionVariables): Promise<UpdateReligionResponse> {
  const response = await fetch(`/api/v1/religions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Religion');
  }

  return response.json() as Promise<UpdateReligionResponse>;
}

export function useUpdateReligion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateReligion,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: RELIGIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: religionQueryKey(variables.id) });
    },
  });
}
