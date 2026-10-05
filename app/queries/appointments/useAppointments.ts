'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { ListAppointmentsResponse } from '@/app/api/v1/appointments/types';
import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
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

const DASHBOARD_DAY_LIMIT = 999;

export function summarizeAppointmentDay(response: ListAppointmentsResponse) {
  const counts = {
    scheduled: 0,
    confirmed: 0,
    checkedIn: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
  };
  const bookingPaths = { consultation: 0, procedure: 0 };
  const activeAppointments: Appointment[] = [];

  for (const appointment of response.data) {
    const category = appointment.appointmentStatus.category;

    if (appointment.bookingPath === 'CONSULTATION') bookingPaths.consultation += 1;
    if (appointment.bookingPath === 'PROCEDURE') bookingPaths.procedure += 1;

    if (category === 'scheduled') counts.scheduled += 1;
    if (category === 'confirmed') counts.confirmed += 1;
    if (category === 'checked_in') counts.checkedIn += 1;
    if (category === 'completed') counts.completed += 1;
    if (category === 'cancelled') counts.cancelled += 1;
    if (category === 'no_show') counts.noShow += 1;

    if (category === 'scheduled' || category === 'confirmed' || category === 'checked_in') {
      activeAppointments.push(appointment);
    }
  }

  return {
    total: response.meta.total,
    counts,
    bookingPaths,
    activeAppointments: activeAppointments.slice(0, 6),
    hasMore: response.meta.total > response.data.length,
  };
}

export function useAppointmentDashboardQuery(slotDate: string, enabled: boolean) {
  const params = { slotDate, limit: DASHBOARD_DAY_LIMIT };

  return useQuery({
    queryKey: appointmentsQueryKey(params),
    queryFn: () => fetchAppointments(params),
    select: summarizeAppointmentDay,
    enabled,
  });
}
