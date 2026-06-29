'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { APPOINTMENT_MODES_KEY } from './useAppointmentModes';

async function deleteAppointmentMode(id: number): Promise<void> {
  const response = await fetch(`/api/v1/appointments/modes/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Appointment Mode');
  }
}

type UseDeleteAppointmentModeOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

export function useDeleteAppointmentMode(options?: UseDeleteAppointmentModeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteAppointmentMode,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENT_MODES_KEY });
      await onSuccess?.(...args);
    },
  });
}
