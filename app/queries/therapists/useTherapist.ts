import { useQuery } from '@tanstack/react-query';

import type { TherapistResponse } from '@/app/api/v1/therapists/types';
import { parseApiError } from '@/app/queries/api-error';

export const therapistQueryKey = (id: number) => ['therapists', id] as const;

async function fetchTherapist(id: number): Promise<TherapistResponse> {
  const response = await fetch(`/api/v1/therapists/${id}`, { credentials: 'same-origin' });
  if (!response.ok) throw await parseApiError(response, 'Could not load Therapist');
  return response.json() as Promise<TherapistResponse>;
}

export function useTherapistQuery(id: number | null) {
  return useQuery({
    enabled: id !== null,
    queryKey: id === null ? ['therapists', 'none'] : therapistQueryKey(id),
    queryFn: () => fetchTherapist(id as number),
  });
}
