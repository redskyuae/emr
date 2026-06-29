'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveAppointmentModeRequest,
  SaveAppointmentModeResponse,
} from '@/app/api/v1/appointments/modes/types';
import { APPOINTMENT_MODES_KEY } from './useAppointmentModes';

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
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createAppointmentMode,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENT_MODES_KEY });
      await onSuccess?.(...args);
    },
  });
}
