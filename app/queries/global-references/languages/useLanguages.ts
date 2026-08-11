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

async function fetchLanguageOptions(): Promise<ListLanguagesResponse> {
  const firstPage = await fetchLanguages({ page: 1, limit: REFERENCE_PAGE_LIMIT });
  const remainingPages = Array.from(
    { length: Math.max(0, firstPage.meta.totalPages - 1) },
    (_, index) => index + 2
  );

  if (remainingPages.length === 0) {
    return firstPage;
  }

  const pages = await Promise.all(
    remainingPages.map((page) => fetchLanguages({ page, limit: REFERENCE_PAGE_LIMIT }))
  );
  const data = [firstPage, ...pages].flatMap((page) => page.data);

  return {
    data,
    meta: {
      total: firstPage.meta.total,
      totalPages: data.length > 0 ? 1 : 0,
      pageSize: data.length,
      pageNumber: 1,
    },
  };
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
    queryFn: fetchLanguageOptions,
    select: transformLanguagesResponse,
  });
}
