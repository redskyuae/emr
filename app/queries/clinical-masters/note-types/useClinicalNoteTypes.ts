import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListClinicalNoteTypesResponse } from '@/app/api/v1/clinical-masters/note-types/types';

type ClinicalNoteTypesParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const CLINICAL_NOTE_TYPES_KEY = ['clinical-note-types'] as const;

export const clinicalNoteTypesQueryKey = (params: ClinicalNoteTypesParams) =>
  [...CLINICAL_NOTE_TYPES_KEY, params] as const;

async function fetchClinicalNoteTypes(
  params: ClinicalNoteTypesParams
): Promise<ListClinicalNoteTypesResponse> {
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

  const url = `/api/v1/clinical-masters/note-types?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Clinical Note Types');
  }

  return response.json() as Promise<ListClinicalNoteTypesResponse>;
}

export function useClinicalNoteTypesQuery(params: ClinicalNoteTypesParams) {
  return useQuery({
    queryKey: clinicalNoteTypesQueryKey(params),
    queryFn: () => fetchClinicalNoteTypes(params),
  });
}
