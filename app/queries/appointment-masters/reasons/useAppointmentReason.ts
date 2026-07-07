'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetAppointmentReasonResponse } from '@/app/api/v1/appointments/reasons/[id]/types';

export const appointmentReasonQueryKey = (id: number) => ['appointment-reason', id] as const;

async function fetchAppointmentReason(id: number): Promise<GetAppointmentReasonResponse> {
  const response = await fetch(`/api/v1/appointments/reasons/${id}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Appointment Reason');
  }

  return response.json() as Promise<GetAppointmentReasonResponse>;
}

export function useAppointmentReasonQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['appointment-reason', 'none'] : appointmentReasonQueryKey(id),
    queryFn: () => fetchAppointmentReason(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
