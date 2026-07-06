import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListAppointmentStatusesResponse } from '@/app/api/v1/appointments/statuses/types';

type AppointmentStatusesParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const APPOINTMENT_STATUSES_KEY = ['appointment-statuses'] as const;

export const appointmentStatusesQueryKey = (params: AppointmentStatusesParams) =>
  [...APPOINTMENT_STATUSES_KEY, params] as const;

async function fetchAppointmentStatuses(
  params: AppointmentStatusesParams
): Promise<ListAppointmentStatusesResponse> {
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

  const url = `/api/v1/appointments/statuses?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Appointment Statuses');
  }

  return response.json() as Promise<ListAppointmentStatusesResponse>;
}

export function useAppointmentStatusesQuery(params: AppointmentStatusesParams) {
  return useQuery({
    queryKey: appointmentStatusesQueryKey(params),
    queryFn: () => fetchAppointmentStatuses(params),
  });
}

export function useAppointmentStatuses(params: AppointmentStatusesParams) {
  return useSuspenseQuery({
    queryKey: appointmentStatusesQueryKey(params),
    queryFn: () => fetchAppointmentStatuses(params),
  });
}
