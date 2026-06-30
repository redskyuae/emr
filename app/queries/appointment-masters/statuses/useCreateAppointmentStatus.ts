'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveAppointmentStatusRequest,
  SaveAppointmentStatusResponse,
} from '@/app/api/v1/appointments/statuses/types';
import { APPOINTMENT_STATUSES_KEY } from './useAppointmentStatuses';

async function createAppointmentStatus(
  request: SaveAppointmentStatusRequest
): Promise<SaveAppointmentStatusResponse> {
  const response = await fetch('/api/v1/appointments/statuses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Appointment Status');
  }

  return response.json() as Promise<SaveAppointmentStatusResponse>;
}

type UseCreateAppointmentStatusOptions = Omit<
  UseMutationOptions<SaveAppointmentStatusResponse, Error, SaveAppointmentStatusRequest>,
  'mutationFn'
>;

export function useCreateAppointmentStatus(options?: UseCreateAppointmentStatusOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createAppointmentStatus,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENT_STATUSES_KEY });
      await onSuccess?.(...args);
    },
  });
}
