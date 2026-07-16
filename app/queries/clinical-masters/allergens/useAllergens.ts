import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListAllergensResponse } from '@/app/api/v1/clinical-masters/allergens/types';

type AllergensParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const ALLERGENS_KEY = ['allergens'] as const;

export const allergensQueryKey = (params: AllergensParams) => [...ALLERGENS_KEY, params] as const;

async function fetchAllergens(params: AllergensParams): Promise<ListAllergensResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.query) {
    searchParams.set('query', params.query);
  }

  const url = `/api/v1/clinical-masters/allergens?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Allergens');
  }

  return response.json() as Promise<ListAllergensResponse>;
}

export function useAllergensQuery(params: AllergensParams) {
  return useQuery({
    queryKey: allergensQueryKey(params),
    queryFn: () => fetchAllergens(params),
  });
}
