'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  SaveTherapistScheduleRequest,
  SaveTherapistScheduleResponse,
} from '@/app/api/v1/therapist-schedules/types';
import { parseApiError } from '@/app/queries/api-error';
import { therapistSchedulesBaseKey } from './useTherapistSchedules';

async function createTherapistSchedule(
  request: SaveTherapistScheduleRequest
): Promise<SaveTherapistScheduleResponse> {
  const response = await fetch('/api/v1/therapist-schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });
  if (!response.ok) throw await parseApiError(response, 'Could not create Therapist Schedule');
  return response.json() as Promise<SaveTherapistScheduleResponse>;
}

export function useCreateTherapistSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTherapistSchedule,
    onSettled: () => void queryClient.invalidateQueries({ queryKey: therapistSchedulesBaseKey }),
  });
}
