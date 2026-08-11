'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { SaveLanguageRequest, SaveLanguageResponse } from '@/app/api/v1/languages/types';
import { LANGUAGES_KEY } from './useLanguages';

async function createLanguage(request: SaveLanguageRequest): Promise<SaveLanguageResponse> {
  const response = await fetch('/api/v1/languages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Language');
  }

  return response.json() as Promise<SaveLanguageResponse>;
}

export function useCreateLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLanguage,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: LANGUAGES_KEY });
    },
  });
}
