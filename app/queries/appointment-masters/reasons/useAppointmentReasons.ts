import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListAppointmentReasonsResponse } from '@/app/api/v1/appointments/reasons/types';

type AppointmentReasonsParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const APPOINTMENT_REASONS_KEY = ['appointment-reasons'] as const;

export const appointmentReasonsQueryKey = (params: AppointmentReasonsParams) =>
  [...APPOINTMENT_REASONS_KEY, params] as const;

async function fetchAppointmentReasons(
  params: AppointmentReasonsParams
): Promise<ListAppointmentReasonsResponse> {
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

  const url = `/api/v1/appointments/reasons?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Appointment Reasons');
  }

  return response.json() as Promise<ListAppointmentReasonsResponse>;
}

export function useAppointmentReasonsQuery(params: AppointmentReasonsParams) {
  return useQuery({
    queryKey: appointmentReasonsQueryKey(params),
    queryFn: () => fetchAppointmentReasons(params),
  });
}

export function useAppointmentReasons(params: AppointmentReasonsParams) {
  return useSuspenseQuery({
    queryKey: appointmentReasonsQueryKey(params),
    queryFn: () => fetchAppointmentReasons(params),
  });
}
