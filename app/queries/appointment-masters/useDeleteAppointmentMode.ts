'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { DeleteAppointmentModeResponse } from '@/app/api/v1/appointments/modes/[id]/types';

async function deleteAppointmentMode(id: number): Promise<DeleteAppointmentModeResponse> {
  const response = await fetch(`/api/v1/appointments/modes/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Appointment Mode');
  }
}

type UseDeleteAppointmentModeOptions = Omit<
  UseMutationOptions<DeleteAppointmentModeResponse, Error, number>,
  'mutationFn'
>;

export function useDeleteAppointmentMode(options?: UseDeleteAppointmentModeOptions) {
  return useMutation({ mutationFn: deleteAppointmentMode, ...options });
}
