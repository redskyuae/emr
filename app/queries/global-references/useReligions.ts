import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListReligionsResponse } from '@/app/api/v1/religions/types';

const REFERENCE_PAGE_LIMIT = 999;

export const religionsQueryKey = ['religions', 'list'] as const;

async function fetchReligions(): Promise<ListReligionsResponse> {
  const response = await fetch(`/api/v1/religions?limit=${REFERENCE_PAGE_LIMIT}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Religions');
  }

  return response.json() as Promise<ListReligionsResponse>;
}

function transformReligionsResponse(response: ListReligionsResponse) {
  return response.data;
}

export function useReligionsQuery() {
  return useQuery({
    queryKey: religionsQueryKey,
    queryFn: fetchReligions,
    select: transformReligionsResponse,
  });
}
