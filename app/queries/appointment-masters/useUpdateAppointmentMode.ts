'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { UpdateAppointmentModeRequest, UpdateAppointmentModeResponse, } from '@/app/api/v1/appointments/modes/[id]/types';
import { APPOINTMENT_MODES_KEY } from './useAppointmentModes';

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
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateAppointmentMode,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENT_MODES_KEY });
      await onSuccess?.(...args);
    },
  });
}
