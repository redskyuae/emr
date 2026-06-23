'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { UpdateAppointmentModeRequest, UpdateAppointmentModeResponse, } from '@/app/api/v1/appointments/modes/[id]/types';

type UpdateAppointmentModeVariables = {
  id: number;
  request: UpdateAppointmentModeRequest;
};

async function updateAppointmentMode({
  id,
  request,
}: UpdateAppointmentModeVariables): Promise<UpdateAppointmentModeResponse> {
  const response = await fetch(`/api/v1/appointments/modes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Appointment Mode');
  }

  return response.json() as Promise<UpdateAppointmentModeResponse>;
}

type UseUpdateAppointmentModeOptions = Omit<
  UseMutationOptions<UpdateAppointmentModeResponse, Error, UpdateAppointmentModeVariables>,
  'mutationFn'
>;

export function useUpdateAppointmentMode(options?: UseUpdateAppointmentModeOptions) {
  return useMutation({ mutationFn: updateAppointmentMode, ...options });
}
