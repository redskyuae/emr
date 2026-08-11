'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetLanguageResponse } from '@/app/api/v1/languages/[id]/types';

export const languageQueryKey = (id: number) => ['language', id] as const;

async function fetchLanguage(id: number): Promise<GetLanguageResponse> {
  const response = await fetch(`/api/v1/languages/${id}`, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Language');
  }

  return response.json() as Promise<GetLanguageResponse>;
}

export function useLanguageQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['language', 'none'] : languageQueryKey(id),
    queryFn: () => fetchLanguage(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
