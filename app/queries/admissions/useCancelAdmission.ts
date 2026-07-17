'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  CancelAdmissionRequest,
  CancelAdmissionResponse,
} from '@/app/api/v1/admissions/[id]/cancel/types';
import { BEDS_KEY } from '@/app/queries/inpatient-masters/beds/useBeds';
import { admissionQueryKey } from './useAdmission';
import { ADMISSIONS_KEY } from './useAdmissions';

type CancelAdmissionVariables = {
  id: number;
  request: CancelAdmissionRequest;
};

async function cancelAdmission({
  id,
  request,
}: CancelAdmissionVariables): Promise<CancelAdmissionResponse> {
  const response = await fetch(`/api/v1/admissions/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not cancel the Admission');
  }

  return response.json() as Promise<CancelAdmissionResponse>;
}

type UseCancelAdmissionOptions = Omit<
  UseMutationOptions<CancelAdmissionResponse, Error, CancelAdmissionVariables>,
  'mutationFn'
>;

export function useCancelAdmission(options?: UseCancelAdmissionOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: cancelAdmission,
    onSuccess: async (...args) => {
      const [, { id }] = args;
      // Admission lifecycle writes flip Bed statuses, so the Bed caches
      // (lists and the Bed Board) refresh together with the census.
      await queryClient.invalidateQueries({ queryKey: ADMISSIONS_KEY });
      await queryClient.invalidateQueries({ queryKey: admissionQueryKey(id) });
      await queryClient.invalidateQueries({ queryKey: BEDS_KEY });
      await onSuccess?.(...args);
    },
  });
}
