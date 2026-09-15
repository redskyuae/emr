'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  RescheduleAppointmentRequest,
  RescheduleAppointmentResponse,
} from '@/app/api/v1/appointments/[id]/reschedule/types';
import { parseApiError } from '@/app/queries/api-error';
import { appointmentQueryKey } from './useAppointment';
import { appointmentsBaseKey } from './useAppointments';
import { doctorSlotsBaseKey } from './useDoctorSlots';

type RescheduleAppointmentVariables = {
  appointmentId: number;
  request: RescheduleAppointmentRequest;
};

async function rescheduleAppointment({
  appointmentId,
  request,
}: RescheduleAppointmentVariables): Promise<RescheduleAppointmentResponse> {
  const response = await fetch(`/api/v1/appointments/${appointmentId}/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not reschedule Appointment');
  }

  return response.json() as Promise<RescheduleAppointmentResponse>;
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rescheduleAppointment,
    onSettled: (_response, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: appointmentsBaseKey });
      void queryClient.invalidateQueries({ queryKey: doctorSlotsBaseKey });
      void queryClient.invalidateQueries({
        queryKey: appointmentQueryKey(variables.appointmentId),
      });
    },
  });
}
