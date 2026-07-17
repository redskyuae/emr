import { useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetAdmissionResponse } from '@/app/api/v1/admissions/[id]/types';

export const admissionQueryKey = (admissionId: number) =>
  ['admissions', 'detail', admissionId] as const;

async function fetchAdmission(admissionId: number): Promise<GetAdmissionResponse> {
  const response = await fetch(`/api/v1/admissions/${admissionId}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Admission');
  }

  return response.json() as Promise<GetAdmissionResponse>;
}

function transformAdmissionResponse(response: GetAdmissionResponse) {
  return response.data;
}

// Suspense: the Admission detail page cannot render without its Admission.
export function useAdmission(admissionId: number) {
  return useSuspenseQuery({
    queryKey: admissionQueryKey(admissionId),
    queryFn: () => fetchAdmission(admissionId),
    select: transformAdmissionResponse,
  });
}
