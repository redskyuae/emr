import { useQuery } from '@tanstack/react-query';

import type { ListDoctorSlotsResponse } from '@/app/api/v1/doctor-slots/types';
import { parseApiError } from '@/app/queries/api-error';

export type DoctorSlotsFilters = {
  doctorId: number | null;
  slotDate: string;
  reschedulingAppointmentId?: number;
};

export const doctorSlotsBaseKey = ['doctor-slots'] as const;
export const doctorSlotsQueryKey = (filters: DoctorSlotsFilters) =>
  [...doctorSlotsBaseKey, filters] as const;

export type DoctorRotaOption = {
  id: string;
  name: string;
  duration: number;
  slots: Array<{ time: string; status: 'Available' | 'Booked' }>;
};

export function transformDoctorSlotsResponse(
  response: ListDoctorSlotsResponse
): DoctorRotaOption[] {
  return response.data.flatMap((date) =>
    date.rotas.map((rota) => ({
      id: String(rota.doctorRotaId),
      name: rota.rotaName,
      duration: rota.duration,
      slots: rota.slots.map((slot) => ({
        time: slot.slotTime,
        status: slot.slotStatus,
      })),
    }))
  );
}

function buildDoctorSlotsParams(filters: {
  doctorId: number;
  slotDate: string;
  reschedulingAppointmentId?: number;
}) {
  const params = new URLSearchParams();
  params.set('doctorId', String(filters.doctorId));
  params.set('slotDate', filters.slotDate);
  if (filters.reschedulingAppointmentId) {
    params.set('reschedulingAppointmentId', String(filters.reschedulingAppointmentId));
  }

  return params.toString();
}

async function fetchDoctorSlots(filters: {
  doctorId: number;
  slotDate: string;
  reschedulingAppointmentId?: number;
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
        reschedulingAppointmentId: filters.reschedulingAppointmentId,
      }),
    select: transformDoctorSlotsResponse,
  });
}
