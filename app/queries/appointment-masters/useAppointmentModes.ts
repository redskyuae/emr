import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListAppointmentModesResponse } from '@/app/api/v1/appointments/modes/types';

type AppointmentModesParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const APPOINTMENT_MODES_KEY = ['appointment-modes'] as const;

export const appointmentModesQueryKey = (params: AppointmentModesParams) =>
  [...APPOINTMENT_MODES_KEY, params] as const;

async function fetchAppointmentModes(
  params: AppointmentModesParams
): Promise<ListAppointmentModesResponse> {
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

  const url = `/api/v1/appointments/modes?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Appointment Modes');
  }

  return response.json() as Promise<ListAppointmentModesResponse>;
}

export function useAppointmentModesQuery(params: AppointmentModesParams) {
  return useQuery({
    queryKey: appointmentModesQueryKey(params),
    queryFn: () => fetchAppointmentModes(params),
  });
}

export function useAppointmentModes(params: AppointmentModesParams) {
  return useSuspenseQuery({
    queryKey: appointmentModesQueryKey(params),
    queryFn: () => fetchAppointmentModes(params),
  });
}
