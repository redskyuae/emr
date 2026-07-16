'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateAllergenRequest,
  UpdateAllergenResponse,
} from '@/app/api/v1/clinical-masters/allergens/[id]/types';
import { ALLERGENS_KEY } from './useAllergens';

type UpdateAllergenVariables = {
  id: number;
  request: UpdateAllergenRequest;
};

async function updateAllergen({
  id,
  request,
}: UpdateAllergenVariables): Promise<UpdateAllergenResponse> {
  const response = await fetch(`/api/v1/clinical-masters/allergens/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Allergen');
  }

  return response.json() as Promise<UpdateAllergenResponse>;
}

type UseUpdateAllergenOptions = Omit<
  UseMutationOptions<UpdateAllergenResponse, Error, UpdateAllergenVariables>,
  'mutationFn'
>;

export function useUpdateAllergen(options?: UseUpdateAllergenOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateAllergen,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: ALLERGENS_KEY });
      await onSuccess?.(...args);
    },
  });
}
