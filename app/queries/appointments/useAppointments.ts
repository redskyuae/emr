'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { ListAppointmentsResponse } from '@/app/api/v1/appointments/types';
import { parseApiError } from '@/app/queries/api-error';

export type AppointmentsParams = {
  slotDate?: string;
  doctorId?: number;
  patientId?: number;
  appointmentStatusId?: number;
  query?: string;
  page?: number;
  limit?: number;
};

export const appointmentsBaseKey = ['appointments'] as const;

const appointmentsQueryKey = (params: AppointmentsParams) =>
  [...appointmentsBaseKey, params] as const;

async function fetchAppointments(params: AppointmentsParams): Promise<ListAppointmentsResponse> {
  const searchParams = new URLSearchParams();

  if (params.slotDate) searchParams.set('slotDate', params.slotDate);
  if (params.doctorId) searchParams.set('doctorId', String(params.doctorId));
  if (params.patientId) searchParams.set('patientId', String(params.patientId));
  if (params.appointmentStatusId) {
    searchParams.set('appointmentStatusId', String(params.appointmentStatusId));
  }
  if (params.query) searchParams.set('query', params.query);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const response = await fetch(`/api/v1/appointments?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Appointments');
  }

  return response.json() as Promise<ListAppointmentsResponse>;
}

export function useAppointmentsQuery(params: AppointmentsParams) {
  return useQuery({
    queryKey: appointmentsQueryKey(params),
    queryFn: () => fetchAppointments(params),
    placeholderData: keepPreviousData,
  });
}
