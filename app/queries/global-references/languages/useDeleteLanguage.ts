'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { languageQueryKey } from './useLanguage';
import { LANGUAGES_KEY } from './useLanguages';

async function deleteLanguage(id: number): Promise<void> {
  const response = await fetch(`/api/v1/languages/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Language');
  }
}

export function useDeleteLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLanguage,
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: LANGUAGES_KEY });
      void queryClient.invalidateQueries({ queryKey: languageQueryKey(id) });
    },
  });
}
