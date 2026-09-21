import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListTreatmentsResponse } from '@/app/api/v1/treatments/types';

export type TreatmentsParams = {
  query?: string;
  page?: number;
  limit?: number;
};

type TreatmentsQueryOptions = {
  enabled?: boolean;
};

export const TREATMENTS_KEY = ['treatments'] as const;

export const treatmentsQueryKey = (params: TreatmentsParams) =>
  [...TREATMENTS_KEY, params] as const;

async function fetchTreatments(params: TreatmentsParams): Promise<ListTreatmentsResponse> {
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

  const url = `/api/v1/treatments?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Treatments');
  }

  return response.json() as Promise<ListTreatmentsResponse>;
}

export function useTreatmentsQuery(
  params: TreatmentsParams,
  { enabled = true }: TreatmentsQueryOptions = {}
) {
  return useQuery({
    queryKey: treatmentsQueryKey(params),
    queryFn: () => fetchTreatments(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}
