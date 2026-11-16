import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListAyurvedaDiagnosisCodesResponse } from '@/app/api/v1/clinical-masters/ayurveda-diagnosis-codes/types';

type AyurvedaDiagnosisCodesParams = {
  limit: number;
  page?: number;
  query?: string;
};

export const ayurvedaDiagnosisCodesQueryKey = ['ayurveda-diagnosis-codes'] as const;

const ayurvedaDiagnosisCodesListQueryKey = (params: AyurvedaDiagnosisCodesParams) =>
  [...ayurvedaDiagnosisCodesQueryKey, params] as const;

async function fetchAyurvedaDiagnosisCodes(
  params: AyurvedaDiagnosisCodesParams
): Promise<ListAyurvedaDiagnosisCodesResponse> {
  const searchParams = new URLSearchParams({ limit: String(params.limit) });

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.query) {
    searchParams.set('query', params.query);
  }

  const url = `/api/v1/clinical-masters/ayurveda-diagnosis-codes?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Ayurveda Diagnosis Codes');
  }

  return response.json() as Promise<ListAyurvedaDiagnosisCodesResponse>;
}

export function useAyurvedaDiagnosisCodesQuery(
  params: AyurvedaDiagnosisCodesParams,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    enabled,
    queryKey: ayurvedaDiagnosisCodesListQueryKey(params),
    queryFn: () => fetchAyurvedaDiagnosisCodes(params),
  });
}
