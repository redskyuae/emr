import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListDiagnosisCodesResponse } from '@/app/api/v1/clinical-masters/diagnosis-codes/types';

type DiagnosisCodesParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const DIAGNOSIS_CODES_KEY = ['diagnosis-codes'] as const;

export const diagnosisCodesQueryKey = (params: DiagnosisCodesParams) =>
  [...DIAGNOSIS_CODES_KEY, params] as const;

async function fetchDiagnosisCodes(
  params: DiagnosisCodesParams
): Promise<ListDiagnosisCodesResponse> {
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

  const url = `/api/v1/clinical-masters/diagnosis-codes?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Diagnosis Codes');
  }

  return response.json() as Promise<ListDiagnosisCodesResponse>;
}

export function useDiagnosisCodesQuery(params: DiagnosisCodesParams) {
  return useQuery({
    queryKey: diagnosisCodesQueryKey(params),
    queryFn: () => fetchDiagnosisCodes(params),
  });
}
