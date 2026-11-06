'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveAdmitSourceRequest,
  SaveAdmitSourceResponse,
} from '@/app/api/v1/visits/admit-sources/types';
import { ADMIT_SOURCES_KEY } from './useAdmitSources';

async function createAdmitSource(
  request: SaveAdmitSourceRequest
): Promise<SaveAdmitSourceResponse> {
  const response = await fetch('/api/v1/visits/admit-sources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Admit Source');
  }

  return response.json() as Promise<SaveAdmitSourceResponse>;
}

type UseCreateAdmitSourceOptions = Omit<
  UseMutationOptions<SaveAdmitSourceResponse, Error, SaveAdmitSourceRequest>,
  'mutationFn'
>;

export function useCreateAdmitSource(options?: UseCreateAdmitSourceOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createAdmitSource,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: ADMIT_SOURCES_KEY });
      await onSuccess?.(...args);
    },
  });
}
