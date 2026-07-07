import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListNationalitiesResponse } from '@/app/api/v1/nationalities/types';

const REFERENCE_PAGE_LIMIT = 999;

export const nationalitiesQueryKey = ['nationalities', 'list'] as const;

async function fetchNationalities(): Promise<ListNationalitiesResponse> {
  const response = await fetch(`/api/v1/nationalities?limit=${REFERENCE_PAGE_LIMIT}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Nationalities');
  }

  return response.json() as Promise<ListNationalitiesResponse>;
}

function transformNationalitiesResponse(response: ListNationalitiesResponse) {
  return response.data;
}

export function useNationalitiesQuery() {
  return useQuery({
    queryKey: nationalitiesQueryKey,
    queryFn: fetchNationalities,
    select: transformNationalitiesResponse,
  });
}
