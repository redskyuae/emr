import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListLanguagesResponse } from '@/app/api/v1/languages/types';

const REFERENCE_PAGE_LIMIT = 999;

export const languagesQueryKey = ['languages', 'list'] as const;

async function fetchLanguages(): Promise<ListLanguagesResponse> {
  const response = await fetch(`/api/v1/languages?limit=${REFERENCE_PAGE_LIMIT}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Languages');
  }

  return response.json() as Promise<ListLanguagesResponse>;
}

function transformLanguagesResponse(response: ListLanguagesResponse) {
  return response.data;
}

export function useLanguagesQuery() {
  return useQuery({
    queryKey: languagesQueryKey,
    queryFn: fetchLanguages,
    select: transformLanguagesResponse,
  });
}
