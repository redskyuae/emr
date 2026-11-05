import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListAyurvedaDiagnosisCodesResponse } from '@/app/api/v1/clinical-masters/ayurveda-diagnosis-codes/types';

type AyurvedaDiagnosisCodesParams = {
  query?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
};

export const AYURVEDA_DIAGNOSIS_CODES_KEY = ['ayurveda-diagnosis-codes'] as const;

const ayurvedaDiagnosisCodesQueryKey = (params: AyurvedaDiagnosisCodesParams) =>
  [...AYURVEDA_DIAGNOSIS_CODES_KEY, params] as const;

async function fetchAyurvedaDiagnosisCodes(
  params: AyurvedaDiagnosisCodesParams
): Promise<ListAyurvedaDiagnosisCodesResponse> {
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

  if (params.isActive !== undefined) {
    searchParams.set('isActive', String(params.isActive));
  }

  const url = `/api/v1/clinical-masters/ayurveda-diagnosis-codes?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Ayurveda Diagnosis Codes');
  }

  return response.json() as Promise<ListAyurvedaDiagnosisCodesResponse>;
}

export function useAyurvedaDiagnosisCodesQuery(params: AyurvedaDiagnosisCodesParams) {
  return useQuery({
    queryKey: ayurvedaDiagnosisCodesQueryKey(params),
    queryFn: () => fetchAyurvedaDiagnosisCodes(params),
  });
}
