'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveAllergenRequest,
  SaveAllergenResponse,
} from '@/app/api/v1/clinical-masters/allergens/types';
import { ALLERGENS_KEY } from './useAllergens';

async function createAllergen(request: SaveAllergenRequest): Promise<SaveAllergenResponse> {
  const response = await fetch('/api/v1/clinical-masters/allergens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Allergen');
  }

  return response.json() as Promise<SaveAllergenResponse>;
}

type UseCreateAllergenOptions = Omit<
  UseMutationOptions<SaveAllergenResponse, Error, SaveAllergenRequest>,
  'mutationFn'
>;

export function useCreateAllergen(options?: UseCreateAllergenOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createAllergen,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: ALLERGENS_KEY });
      await onSuccess?.(...args);
    },
  });
}
