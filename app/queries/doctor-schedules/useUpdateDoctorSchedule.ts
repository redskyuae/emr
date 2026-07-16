'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  SaveDoctorScheduleResponse,
  UpdateDoctorScheduleRequest,
} from '@/app/api/v1/doctor-schedules/types';
import { parseApiError } from '@/app/queries/api-error';

import { doctorSchedulesBaseKey } from './useDoctorSchedules';

async function updateDoctorSchedule(
  request: UpdateDoctorScheduleRequest
): Promise<SaveDoctorScheduleResponse> {
  const response = await fetch('/api/v1/doctor-schedules', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Doctor Schedule');
  }

  return response.json() as Promise<SaveDoctorScheduleResponse>;
}

export function useUpdateDoctorSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDoctorSchedule,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: doctorSchedulesBaseKey });
    },
  });
}
