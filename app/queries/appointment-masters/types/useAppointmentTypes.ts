import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListAppointmentTypesResponse } from '@/app/api/v1/appointments/types/types';

type AppointmentTypesParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const APPOINTMENT_TYPES_KEY = ['appointment-types'] as const;

export const appointmentTypesQueryKey = (params: AppointmentTypesParams) =>
  [...APPOINTMENT_TYPES_KEY, params] as const;

async function fetchAppointmentTypes(
  params: AppointmentTypesParams
): Promise<ListAppointmentTypesResponse> {
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

  const url = `/api/v1/appointments/types?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Appointment Types');
  }

  return response.json() as Promise<ListAppointmentTypesResponse>;
}

export function useAppointmentTypesQuery(params: AppointmentTypesParams) {
  return useQuery({
    queryKey: appointmentTypesQueryKey(params),
    queryFn: () => fetchAppointmentTypes(params),
  });
}

export function useAppointmentTypes(params: AppointmentTypesParams) {
  return useSuspenseQuery({
    queryKey: appointmentTypesQueryKey(params),
    queryFn: () => fetchAppointmentTypes(params),
  });
}
