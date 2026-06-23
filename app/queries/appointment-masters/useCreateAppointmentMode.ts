'use client';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { parseApiError } from '@/app/queries/api-error';
import type { SaveAppointmentModeRequest, SaveAppointmentModeResponse, } from '@/app/api/v1/appointments/modes/types';

async function createAppointmentMode(
  request: SaveAppointmentModeRequest
): Promise<SaveAppointmentModeResponse> {
  const response = await fetch('/api/v1/appointments/modes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Appointment Mode');
  }

  return response.json() as Promise<SaveAppointmentModeResponse>;
}

type UseCreateAppointmentModeOptions = Omit<
  UseMutationOptions<SaveAppointmentModeResponse, Error, SaveAppointmentModeRequest>,
  'mutationFn'
>;

export function useCreateAppointmentMode(options?: UseCreateAppointmentModeOptions) {
  return useMutation({ mutationFn: createAppointmentMode, ...options });
}
