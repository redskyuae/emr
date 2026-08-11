import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListStatesResponse } from '@/app/api/v1/states/types';

const REFERENCE_PAGE_LIMIT = 999;

export type State = ListStatesResponse['data'][number];

export type StatesParams = {
  page?: number;
  limit?: number;
  query?: string;
  countryId?: number;
};

export const STATES_KEY = ['states'] as const;

export const statesQueryKey = (params: StatesParams) => [...STATES_KEY, 'list', params] as const;

export const stateOptionsQueryKey = (countryId: number) =>
  [...STATES_KEY, 'options', countryId] as const;

function buildStatesUrl(params: StatesParams) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);
  if (params.countryId) searchParams.set('countryId', String(params.countryId));

  const queryString = searchParams.toString();
  return `/api/v1/states${queryString ? `?${queryString}` : ''}`;
}

async function fetchStates(params: StatesParams): Promise<ListStatesResponse> {
  const response = await fetch(buildStatesUrl(params), { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load States');
  }

  return response.json() as Promise<ListStatesResponse>;
}

function transformStatesResponse(response: ListStatesResponse) {
  return response.data;
}

export function useStatesQuery(params: StatesParams) {
  return useQuery({
    queryKey: statesQueryKey(params),
    queryFn: () => fetchStates(params),
  });
}

export function useStateOptionsQuery(countryId: number | null) {
  return useQuery({
    queryKey: stateOptionsQueryKey(countryId ?? -1),
    queryFn: () => fetchStates({ limit: REFERENCE_PAGE_LIMIT, countryId: countryId as number }),
    enabled: countryId !== null,
    select: transformStatesResponse,
  });
}
