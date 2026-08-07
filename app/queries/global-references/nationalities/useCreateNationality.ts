'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveNationalityRequest,
  SaveNationalityResponse,
} from '@/app/api/v1/nationalities/types';
import { NATIONALITIES_KEY } from './useNationalities';

async function createNationality(
  request: SaveNationalityRequest
): Promise<SaveNationalityResponse> {
  const response = await fetch('/api/v1/nationalities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Nationality');
  }

  return response.json() as Promise<SaveNationalityResponse>;
}

export function useCreateNationality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNationality,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: NATIONALITIES_KEY });
    },
  });
}
