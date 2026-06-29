'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveAppointmentTypeRequest,
  SaveAppointmentTypeResponse,
} from '@/app/api/v1/appointments/types/types';
import { APPOINTMENT_TYPES_KEY } from './useAppointmentTypes';

async function createAppointmentType(
  request: SaveAppointmentTypeRequest
): Promise<SaveAppointmentTypeResponse> {
  const response = await fetch('/api/v1/appointments/types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Appointment Type');
  }

  return response.json() as Promise<SaveAppointmentTypeResponse>;
}

type UseCreateAppointmentTypeOptions = Omit<
  UseMutationOptions<SaveAppointmentTypeResponse, Error, SaveAppointmentTypeRequest>,
  'mutationFn'
>;

export function useCreateAppointmentType(options?: UseCreateAppointmentTypeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createAppointmentType,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENT_TYPES_KEY });
      await onSuccess?.(...args);
    },
  });
}
