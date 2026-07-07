'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetAppointmentCancelledReasonResponse } from '@/app/api/v1/appointments/cancelled-reasons/[id]/types';

export const appointmentCancelledReasonQueryKey = (id: number) =>
  ['appointment-cancelled-reason', id] as const;

async function fetchAppointmentCancelledReason(
  id: number
): Promise<GetAppointmentCancelledReasonResponse> {
  const response = await fetch(`/api/v1/appointments/cancelled-reasons/${id}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Appointment Cancelled Reason');
  }

  return response.json() as Promise<GetAppointmentCancelledReasonResponse>;
}

export function useAppointmentCancelledReasonQuery(id: number | null) {
  return useQuery({
    queryKey:
      id === null
        ? ['appointment-cancelled-reason', 'none']
        : appointmentCancelledReasonQueryKey(id),
    queryFn: () => fetchAppointmentCancelledReason(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
