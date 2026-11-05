import { useQuery } from '@tanstack/react-query';

import type { GetVisitPatientTypeResponse } from '@/app/api/v1/visits/patient-type/types';
import { parseApiError } from '@/app/queries/api-error';

export const visitPatientTypeQueryKey = (patientId: number | null) =>
  ['visits', 'patient-type', patientId] as const;

async function fetchVisitPatientType(patientId: number): Promise<GetVisitPatientTypeResponse> {
  const response = await fetch(`/api/v1/visits/patient-type?patientId=${patientId}`, {
    credentials: 'same-origin',
  });
  if (!response.ok) throw await parseApiError(response, 'Could not verify Patient type');
  return response.json() as Promise<GetVisitPatientTypeResponse>;
}

export function useVisitPatientTypeQuery(patientId: number | null) {
  return useQuery({
    queryKey: visitPatientTypeQueryKey(patientId),
    queryFn: () => fetchVisitPatientType(patientId as number),
    enabled: patientId !== null,
    select: (response) => response.data,
    staleTime: 0,
  });
}
