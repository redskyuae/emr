'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateAppointmentReasonRequest,
  UpdateAppointmentReasonResponse,
} from '@/app/api/v1/appointments/reasons/[id]/types';
import { appointmentReasonQueryKey } from './useAppointmentReason';
import { APPOINTMENT_REASONS_KEY } from './useAppointmentReasons';

type UpdateAppointmentReasonVariables = {
  id: number;
  request: UpdateAppointmentReasonRequest;
};

async function updateAppointmentReason({
  id,
  request,
}: UpdateAppointmentReasonVariables): Promise<UpdateAppointmentReasonResponse> {
  const response = await fetch(`/api/v1/appointments/reasons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Appointment Reason');
  }

  return response.json() as Promise<UpdateAppointmentReasonResponse>;
}

type UseUpdateAppointmentReasonOptions = Omit<
  UseMutationOptions<UpdateAppointmentReasonResponse, Error, UpdateAppointmentReasonVariables>,
  'mutationFn'
>;

export function useUpdateAppointmentReason(options?: UseUpdateAppointmentReasonOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateAppointmentReason,
    onSuccess: async (...args) => {
      const [, variables] = args;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: APPOINTMENT_REASONS_KEY }),
        queryClient.invalidateQueries({ queryKey: appointmentReasonQueryKey(variables.id) }),
      ]);
      await onSuccess?.(...args);
    },
  });
}
