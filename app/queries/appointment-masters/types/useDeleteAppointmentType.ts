'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { APPOINTMENT_TYPES_KEY } from './useAppointmentTypes';

async function deleteAppointmentType(id: number): Promise<void> {
  const response = await fetch(`/api/v1/appointments/types/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Appointment Type');
  }
}

type UseDeleteAppointmentTypeOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

export function useDeleteAppointmentType(options?: UseDeleteAppointmentTypeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteAppointmentType,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENT_TYPES_KEY });
      await onSuccess?.(...args);
    },
  });
}
