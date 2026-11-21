'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateAdmitSourceRequest,
  UpdateAdmitSourceResponse,
} from '@/app/api/v1/visits/admit-sources/[id]/types';
import { ADMIT_SOURCES_KEY } from './useAdmitSources';

type UpdateAdmitSourceVariables = {
  id: number;
  request: UpdateAdmitSourceRequest;
};

async function updateAdmitSource({
  id,
  request,
}: UpdateAdmitSourceVariables): Promise<UpdateAdmitSourceResponse> {
  const response = await fetch(`/api/v1/visits/admit-sources/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Admit Source');
  }

  return response.json() as Promise<UpdateAdmitSourceResponse>;
}

type UseUpdateAdmitSourceOptions = Omit<
  UseMutationOptions<UpdateAdmitSourceResponse, Error, UpdateAdmitSourceVariables>,
  'mutationFn'
>;

export function useUpdateAdmitSource(options?: UseUpdateAdmitSourceOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateAdmitSource,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: ADMIT_SOURCES_KEY });
      await onSuccess?.(...args);
    },
  });
}
