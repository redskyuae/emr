'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateAppointmentCancelledReasonRequest,
  UpdateAppointmentCancelledReasonResponse,
} from '@/app/api/v1/appointments/cancelled-reasons/[id]/types';
import { appointmentCancelledReasonQueryKey } from './useAppointmentCancelledReason';
import { APPOINTMENT_CANCELLED_REASONS_KEY } from './useAppointmentCancelledReasons';

type UpdateAppointmentCancelledReasonVariables = {
  id: number;
  request: UpdateAppointmentCancelledReasonRequest;
};

async function updateAppointmentCancelledReason({
  id,
  request,
}: UpdateAppointmentCancelledReasonVariables): Promise<UpdateAppointmentCancelledReasonResponse> {
  const response = await fetch(`/api/v1/appointments/cancelled-reasons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Appointment Cancelled Reason');
  }

  return response.json() as Promise<UpdateAppointmentCancelledReasonResponse>;
}

type UseUpdateAppointmentCancelledReasonOptions = Omit<
  UseMutationOptions<
    UpdateAppointmentCancelledReasonResponse,
    Error,
    UpdateAppointmentCancelledReasonVariables
  >,
  'mutationFn'
>;

export function useUpdateAppointmentCancelledReason(
  options?: UseUpdateAppointmentCancelledReasonOptions
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateAppointmentCancelledReason,
    onSuccess: async (...args) => {
      const [, variables] = args;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: APPOINTMENT_CANCELLED_REASONS_KEY }),
        queryClient.invalidateQueries({
          queryKey: appointmentCancelledReasonQueryKey(variables.id),
        }),
      ]);
      await onSuccess?.(...args);
    },
  });
}
