'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateLanguageRequest,
  UpdateLanguageResponse,
} from '@/app/api/v1/languages/[id]/types';
import { languageQueryKey } from './useLanguage';
import { LANGUAGES_KEY } from './useLanguages';

export type UpdateLanguageVariables = {
  id: number;
  request: UpdateLanguageRequest;
};

async function updateLanguage({
  id,
  request,
}: UpdateLanguageVariables): Promise<UpdateLanguageResponse> {
  const response = await fetch(`/api/v1/languages/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Language');
  }

  return response.json() as Promise<UpdateLanguageResponse>;
}

export function useUpdateLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLanguage,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: LANGUAGES_KEY });
      void queryClient.invalidateQueries({ queryKey: languageQueryKey(variables.id) });
    },
  });
}
