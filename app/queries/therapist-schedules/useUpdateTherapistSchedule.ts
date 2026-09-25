'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  SaveTherapistScheduleResponse,
  UpdateTherapistScheduleRequest,
} from '@/app/api/v1/therapist-schedules/types';
import { parseApiError } from '@/app/queries/api-error';
import { therapistSchedulesBaseKey } from './useTherapistSchedules';

async function updateTherapistSchedule(
  request: UpdateTherapistScheduleRequest
): Promise<SaveTherapistScheduleResponse> {
  const response = await fetch('/api/v1/therapist-schedules', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });
  if (!response.ok) throw await parseApiError(response, 'Could not update Therapist Schedule');
  return response.json() as Promise<SaveTherapistScheduleResponse>;
}

export function useUpdateTherapistSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTherapistSchedule,
    onSettled: () => void queryClient.invalidateQueries({ queryKey: therapistSchedulesBaseKey }),
  });
}
