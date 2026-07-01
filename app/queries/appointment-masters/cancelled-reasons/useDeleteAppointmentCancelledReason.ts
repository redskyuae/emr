'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { APPOINTMENT_CANCELLED_REASONS_KEY } from './useAppointmentCancelledReasons';

async function deleteAppointmentCancelledReason(id: number): Promise<void> {
  const response = await fetch(`/api/v1/appointments/cancelled-reasons/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Appointment Cancelled Reason');
  }
}

type UseDeleteAppointmentCancelledReasonOptions = Omit<
  UseMutationOptions<void, Error, number>,
  'mutationFn'
>;

export function useDeleteAppointmentCancelledReason(
  options?: UseDeleteAppointmentCancelledReasonOptions
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteAppointmentCancelledReason,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENT_CANCELLED_REASONS_KEY });
      await onSuccess?.(...args);
    },
  });
}
