'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateNationalityRequest,
  UpdateNationalityResponse,
} from '@/app/api/v1/nationalities/[id]/types';
import { nationalityQueryKey } from './useNationality';
import { NATIONALITIES_KEY } from './useNationalities';

export type UpdateNationalityVariables = {
  id: number;
  request: UpdateNationalityRequest;
};

async function updateNationality({
  id,
  request,
}: UpdateNationalityVariables): Promise<UpdateNationalityResponse> {
  const response = await fetch(`/api/v1/nationalities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Nationality');
  }

  return response.json() as Promise<UpdateNationalityResponse>;
}

export function useUpdateNationality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNationality,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: NATIONALITIES_KEY });
      void queryClient.invalidateQueries({ queryKey: nationalityQueryKey(variables.id) });
    },
  });
}
