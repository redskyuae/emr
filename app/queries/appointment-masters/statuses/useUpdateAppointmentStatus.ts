'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateAppointmentStatusRequest,
  UpdateAppointmentStatusResponse,
} from '@/app/api/v1/appointments/statuses/[id]/types';
import { APPOINTMENT_STATUSES_KEY } from './useAppointmentStatuses';

type UpdateAppointmentStatusVariables = {
  id: number;
  request: UpdateAppointmentStatusRequest;
};

async function updateAppointmentStatus({
  id,
  request,
}: UpdateAppointmentStatusVariables): Promise<UpdateAppointmentStatusResponse> {
  const response = await fetch(`/api/v1/appointments/statuses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Appointment Status');
  }

  return response.json() as Promise<UpdateAppointmentStatusResponse>;
}

type UseUpdateAppointmentStatusOptions = Omit<
  UseMutationOptions<UpdateAppointmentStatusResponse, Error, UpdateAppointmentStatusVariables>,
  'mutationFn'
>;

export function useUpdateAppointmentStatus(options?: UseUpdateAppointmentStatusOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateAppointmentStatus,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENT_STATUSES_KEY });
      await onSuccess?.(...args);
    },
  });
}
