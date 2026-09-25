'use client';

import { useQuery } from '@tanstack/react-query';

import type { GetProcedureResourceAvailabilityResponse } from '@/app/api/v1/appointments/resource-availability/types';
import { parseApiError } from '@/app/queries/api-error';

type ProcedureResourceAvailabilityParams = {
  slotDate: string;
  startTime: string;
  endTime: string;
  patientId?: string;
};

export const procedureResourceAvailabilityQueryKey = (
  params: ProcedureResourceAvailabilityParams
) => ['appointments', 'procedure-resource-availability', params] as const;

async function fetchProcedureResourceAvailability(
  params: ProcedureResourceAvailabilityParams
): Promise<GetProcedureResourceAvailabilityResponse> {
  const searchParams = new URLSearchParams({
    slotDate: params.slotDate,
    startTime: params.startTime,
    endTime: params.endTime,
    ...(params.patientId ? { patientId: params.patientId } : {}),
  });
  const response = await fetch(
    `/api/v1/appointments/resource-availability?${searchParams.toString()}`,
    { credentials: 'same-origin' }
  );

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Procedure resource availability');
  }

  return response.json() as Promise<GetProcedureResourceAvailabilityResponse>;
}

export function useProcedureResourceAvailabilityQuery(
  params: ProcedureResourceAvailabilityParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    enabled: options?.enabled,
    queryKey: procedureResourceAvailabilityQueryKey(params),
    queryFn: () => fetchProcedureResourceAvailability(params),
    select: (response) => response.data,
  });
}
