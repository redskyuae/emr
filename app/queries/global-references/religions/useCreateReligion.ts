'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { SaveReligionRequest, SaveReligionResponse } from '@/app/api/v1/religions/types';
import { RELIGIONS_KEY } from './useReligions';

async function createReligion(request: SaveReligionRequest): Promise<SaveReligionResponse> {
  const response = await fetch('/api/v1/religions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Religion');
  }

  return response.json() as Promise<SaveReligionResponse>;
}

export function useCreateReligion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReligion,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: RELIGIONS_KEY });
    },
  });
}
