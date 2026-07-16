'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  SaveDoctorScheduleRequest,
  SaveDoctorScheduleResponse,
} from '@/app/api/v1/doctor-schedules/types';
import { parseApiError } from '@/app/queries/api-error';

import { doctorSchedulesBaseKey } from './useDoctorSchedules';

async function createDoctorSchedule(
  request: SaveDoctorScheduleRequest
): Promise<SaveDoctorScheduleResponse> {
  const response = await fetch('/api/v1/doctor-schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Doctor Schedule');
  }

  return response.json() as Promise<SaveDoctorScheduleResponse>;
}

export function useCreateDoctorSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDoctorSchedule,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: doctorSchedulesBaseKey });
    },
  });
}
