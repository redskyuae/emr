import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListStatesResponse } from '@/app/api/v1/states/types';

const REFERENCE_PAGE_LIMIT = 999;

export const statesQueryKey = (countryId: number) => ['states', 'list', countryId] as const;

async function fetchStates(countryId: number): Promise<ListStatesResponse> {
  const response = await fetch(
    `/api/v1/states?limit=${REFERENCE_PAGE_LIMIT}&countryId=${countryId}`,
    { credentials: 'same-origin' }
  );

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load States');
  }

  return response.json() as Promise<ListStatesResponse>;
}

function transformStatesResponse(response: ListStatesResponse) {
  return response.data;
}

// Disabled until a Country is chosen — a Patient's State is always scoped to their
// selected Country, so there is nothing meaningful to list beforehand.
export function useStatesQuery(countryId: number | null) {
  return useQuery({
    queryKey: statesQueryKey(countryId ?? -1),
    queryFn: () => fetchStates(countryId as number),
    enabled: countryId !== null,
    select: transformStatesResponse,
  });
}
