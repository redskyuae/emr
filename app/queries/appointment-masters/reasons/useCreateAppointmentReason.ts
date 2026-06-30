'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveAppointmentReasonRequest,
  SaveAppointmentReasonResponse,
} from '@/app/api/v1/appointments/reasons/types';
import { APPOINTMENT_REASONS_KEY } from './useAppointmentReasons';

async function createAppointmentReason(
  request: SaveAppointmentReasonRequest
): Promise<SaveAppointmentReasonResponse> {
  const response = await fetch('/api/v1/appointments/reasons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Appointment Reason');
  }

  return response.json() as Promise<SaveAppointmentReasonResponse>;
}

type UseCreateAppointmentReasonOptions = Omit<
  UseMutationOptions<SaveAppointmentReasonResponse, Error, SaveAppointmentReasonRequest>,
  'mutationFn'
>;

export function useCreateAppointmentReason(options?: UseCreateAppointmentReasonOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createAppointmentReason,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENT_REASONS_KEY });
      await onSuccess?.(...args);
    },
  });
}
