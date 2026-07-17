import { useQuery } from '@tanstack/react-query';

import type { ListDoctorSlotsResponse } from '@/app/api/v1/doctor-slots/types';
import { parseApiError } from '@/app/queries/api-error';

export type DoctorSlotsFilters = {
  doctorId: number | null;
  slotDate: string;
};

export const doctorSlotsQueryKey = (filters: DoctorSlotsFilters) =>
  ['doctor-slots', filters] as const;

function buildDoctorSlotsParams(filters: { doctorId: number; slotDate: string }) {
  const params = new URLSearchParams();
  params.set('doctorId', String(filters.doctorId));
  params.set('slotDate', filters.slotDate);

  return params.toString();
}

async function fetchDoctorSlots(filters: {
  doctorId: number;
  slotDate: string;
}): Promise<ListDoctorSlotsResponse> {
  const response = await fetch(`/api/v1/doctor-slots?${buildDoctorSlotsParams(filters)}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load DoctorSlots');
  }

  return response.json() as Promise<ListDoctorSlotsResponse>;
}

export function useDoctorSlotsQuery(filters: DoctorSlotsFilters) {
  return useQuery({
    enabled: filters.doctorId !== null && filters.slotDate.length > 0,
    queryKey: doctorSlotsQueryKey(filters),
    queryFn: () =>
      fetchDoctorSlots({
        slotDate: filters.slotDate,
        doctorId: filters.doctorId as number,
      }),
  });
}
