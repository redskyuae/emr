'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  CancelAppointmentRequest,
  CancelAppointmentResponse,
} from '@/app/api/v1/appointments/[id]/cancel/types';
import { parseApiError } from '@/app/queries/api-error';
import { doctorSlotsBaseKey } from './useDoctorSlots';
import { appointmentQueryKey } from './useAppointment';
import { appointmentsBaseKey } from './useAppointments';

type CancelAppointmentVariables = {
  appointmentId: number;
  request: CancelAppointmentRequest;
};

async function cancelAppointment({
  appointmentId,
  request,
}: CancelAppointmentVariables): Promise<CancelAppointmentResponse> {
  const response = await fetch(`/api/v1/appointments/${appointmentId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not cancel the Appointment');
  }

  return response.json() as Promise<CancelAppointmentResponse>;
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelAppointment,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: appointmentsBaseKey });
      void queryClient.invalidateQueries({
        queryKey: appointmentQueryKey(variables.appointmentId),
      });
      void queryClient.invalidateQueries({ queryKey: doctorSlotsBaseKey });
    },
  });
}
