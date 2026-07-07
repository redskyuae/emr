import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetPatientResponse } from '@/app/api/v1/patients/[id]/types';
import type { ListPatientsResponse } from '@/app/api/v1/patients/types';
import type { PatientGender } from '@/app/api/lib/modules/patient/schemas/patient-schema';

export type PatientListFilters = {
  page: number;
  limit: number;
  query?: string;
  gender?: PatientGender;
  isActive?: boolean;
};

// Prefix key for invalidating every Patient query (list pages + details) after a write.
export const patientsBaseKey = ['patients'] as const;
export const patientListQueryKey = (filters: PatientListFilters) =>
  ['patients', 'list', filters] as const;
export const patientDetailQueryKey = (patientId: number) =>
  ['patients', 'detail', patientId] as const;

function buildPatientListParams(filters: PatientListFilters) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));

  if (filters.query) {
    params.set('query', filters.query);
  }

  if (filters.gender) {
    params.set('gender', filters.gender);
  }

  if (filters.isActive !== undefined) {
    params.set('isActive', String(filters.isActive));
  }

  return params.toString();
}

async function fetchPatientList(filters: PatientListFilters): Promise<ListPatientsResponse> {
  const response = await fetch(`/api/v1/patients?${buildPatientListParams(filters)}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Patients');
  }

  return response.json() as Promise<ListPatientsResponse>;
}

export function usePatientsQuery(filters: PatientListFilters) {
  return useQuery({
    queryKey: patientListQueryKey(filters),
    queryFn: () => fetchPatientList(filters),
    // Keep the previous page visible while the next page/filter loads, so the
    // table doesn't flash empty on every pagination or filter change.
    placeholderData: keepPreviousData,
  });
}

async function fetchPatientById(patientId: number): Promise<GetPatientResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}`, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Patient');
  }

  return response.json() as Promise<GetPatientResponse>;
}

function transformPatientByIdResponse(response: GetPatientResponse) {
  return response.data;
}

export function usePatientQuery(patientId: number | null) {
  return useQuery({
    queryKey: patientDetailQueryKey(patientId ?? -1),
    queryFn: () => fetchPatientById(patientId as number),
    enabled: patientId !== null,
    select: transformPatientByIdResponse,
  });
}
