'use client';

import { useQuery } from '@tanstack/react-query';

import type { DoctorResponse } from '@/app/api/v1/doctors/[id]/types';
import { parseApiError } from '@/app/queries/api-error';

export const doctorQueryKey = (id: number) => ['doctor', id] as const;

async function fetchDoctor(id: number): Promise<DoctorResponse> {
  const response = await fetch(`/api/v1/doctors/${id}`, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Doctor');
  }

  return response.json() as Promise<DoctorResponse>;
}

export function useDoctorQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['doctor', 'none'] : doctorQueryKey(id),
    queryFn: () => fetchDoctor(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
