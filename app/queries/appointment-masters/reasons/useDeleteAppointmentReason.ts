'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { appointmentReasonQueryKey } from './useAppointmentReason';
import { APPOINTMENT_REASONS_KEY } from './useAppointmentReasons';

async function deleteAppointmentReason(id: number): Promise<void> {
  const response = await fetch(`/api/v1/appointments/reasons/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Appointment Reason');
  }
}

type UseDeleteAppointmentReasonOptions = Omit<
  UseMutationOptions<void, Error, number>,
  'mutationFn'
>;

export function useDeleteAppointmentReason(options?: UseDeleteAppointmentReasonOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteAppointmentReason,
    onSuccess: async (...args) => {
      const [, id] = args;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: APPOINTMENT_REASONS_KEY }),
        queryClient.invalidateQueries({ queryKey: appointmentReasonQueryKey(id) }),
      ]);
      await onSuccess?.(...args);
    },
  });
}
