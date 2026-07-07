import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListAppointmentCancelledReasonsResponse } from '@/app/api/v1/appointments/cancelled-reasons/types';

type AppointmentCancelledReasonsParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const APPOINTMENT_CANCELLED_REASONS_KEY = ['appointment-cancelled-reasons'] as const;

export const appointmentCancelledReasonsQueryKey = (params: AppointmentCancelledReasonsParams) =>
  [...APPOINTMENT_CANCELLED_REASONS_KEY, params] as const;

async function fetchAppointmentCancelledReasons(
  params: AppointmentCancelledReasonsParams
): Promise<ListAppointmentCancelledReasonsResponse> {
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

  const url = `/api/v1/appointments/cancelled-reasons?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Appointment Cancelled Reasons');
  }

  return response.json() as Promise<ListAppointmentCancelledReasonsResponse>;
}

export function useAppointmentCancelledReasonsQuery(params: AppointmentCancelledReasonsParams) {
  return useQuery({
    queryKey: appointmentCancelledReasonsQueryKey(params),
    queryFn: () => fetchAppointmentCancelledReasons(params),
  });
}

export function useAppointmentCancelledReasons(params: AppointmentCancelledReasonsParams) {
  return useSuspenseQuery({
    queryKey: appointmentCancelledReasonsQueryKey(params),
    queryFn: () => fetchAppointmentCancelledReasons(params),
  });
}
