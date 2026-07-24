import { useQuery } from '@tanstack/react-query';

import type { GetAppointmentResponse } from '@/app/api/v1/appointments/[id]/types';
import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import { parseApiError } from '@/app/queries/api-error';

export const appointmentQueryKey = (appointmentId: number) =>
  ['appointments', 'detail', appointmentId] as const;

async function fetchAppointment(appointmentId: number): Promise<GetAppointmentResponse> {
  const response = await fetch(`/api/v1/appointments/${appointmentId}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load the Appointment');
  }

  return response.json() as Promise<GetAppointmentResponse>;
}

function transformAppointmentResponse(response: GetAppointmentResponse): Appointment {
  return response.data;
}

export function useAppointmentQuery(appointmentId: number | null) {
  return useQuery({
    queryKey: appointmentQueryKey(appointmentId ?? 0),
    queryFn: () => fetchAppointment(appointmentId as number),
    select: transformAppointmentResponse,
    enabled: appointmentId !== null,
  });
}
