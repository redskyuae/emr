'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveAppointmentCancelledReasonRequest,
  SaveAppointmentCancelledReasonResponse,
} from '@/app/api/v1/appointments/cancelled-reasons/types';
import { APPOINTMENT_CANCELLED_REASONS_KEY } from './useAppointmentCancelledReasons';

async function createAppointmentCancelledReason(
  request: SaveAppointmentCancelledReasonRequest
): Promise<SaveAppointmentCancelledReasonResponse> {
  const response = await fetch('/api/v1/appointments/cancelled-reasons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Appointment Cancelled Reason');
  }

  return response.json() as Promise<SaveAppointmentCancelledReasonResponse>;
}

type UseCreateAppointmentCancelledReasonOptions = Omit<
  UseMutationOptions<
    SaveAppointmentCancelledReasonResponse,
    Error,
    SaveAppointmentCancelledReasonRequest
  >,
  'mutationFn'
>;

export function useCreateAppointmentCancelledReason(
  options?: UseCreateAppointmentCancelledReasonOptions
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createAppointmentCancelledReason,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENT_CANCELLED_REASONS_KEY });
      await onSuccess?.(...args);
    },
  });
}
