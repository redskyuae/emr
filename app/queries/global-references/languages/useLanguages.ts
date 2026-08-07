import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListLanguagesResponse } from '@/app/api/v1/languages/types';

const REFERENCE_PAGE_LIMIT = 999;

export type Language = ListLanguagesResponse['data'][number];

export type LanguagesParams = {
  page?: number;
  limit?: number;
  query?: string;
};

export const LANGUAGES_KEY = ['languages'] as const;

export const languagesQueryKey = (params: LanguagesParams) =>
  [...LANGUAGES_KEY, 'list', params] as const;

export const languageOptionsQueryKey = [...LANGUAGES_KEY, 'options'] as const;

function buildLanguagesUrl(params: LanguagesParams) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);

  const queryString = searchParams.toString();
  return `/api/v1/languages${queryString ? `?${queryString}` : ''}`;
}

async function fetchLanguages(params: LanguagesParams): Promise<ListLanguagesResponse> {
  const response = await fetch(buildLanguagesUrl(params), { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Languages');
  }

  return response.json() as Promise<ListLanguagesResponse>;
}

function transformLanguagesResponse(response: ListLanguagesResponse) {
  return response.data;
}

export function useLanguagesQuery(params: LanguagesParams) {
  return useQuery({
    queryKey: languagesQueryKey(params),
    queryFn: () => fetchLanguages(params),
  });
}

export function useLanguageOptionsQuery() {
  return useQuery({
    queryKey: languageOptionsQueryKey,
    queryFn: () => fetchLanguages({ limit: REFERENCE_PAGE_LIMIT }),
    select: transformLanguagesResponse,
  });
}
