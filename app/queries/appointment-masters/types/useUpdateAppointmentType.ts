'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateAppointmentTypeRequest,
  UpdateAppointmentTypeResponse,
} from '@/app/api/v1/appointments/types/[id]/types';
import { APPOINTMENT_TYPES_KEY } from './useAppointmentTypes';

type UpdateAppointmentTypeVariables = {
  id: number;
  request: UpdateAppointmentTypeRequest;
};

async function updateAppointmentType({
  id,
  request,
}: UpdateAppointmentTypeVariables): Promise<UpdateAppointmentTypeResponse> {
  const response = await fetch(`/api/v1/appointments/types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Appointment Type');
  }

  return response.json() as Promise<UpdateAppointmentTypeResponse>;
}

type UseUpdateAppointmentTypeOptions = Omit<
  UseMutationOptions<UpdateAppointmentTypeResponse, Error, UpdateAppointmentTypeVariables>,
  'mutationFn'
>;

export function useUpdateAppointmentType(options?: UseUpdateAppointmentTypeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateAppointmentType,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENT_TYPES_KEY });
      await onSuccess?.(...args);
    },
  });
}
