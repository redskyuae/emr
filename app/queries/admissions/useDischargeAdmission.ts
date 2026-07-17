'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  DischargeAdmissionRequest,
  DischargeAdmissionResponse,
} from '@/app/api/v1/admissions/[id]/discharge/types';
import { BEDS_KEY } from '@/app/queries/inpatient-masters/beds/useBeds';
import { admissionQueryKey } from './useAdmission';
import { ADMISSIONS_KEY } from './useAdmissions';

type DischargeAdmissionVariables = {
  id: number;
  request: DischargeAdmissionRequest;
};

async function dischargeAdmission({
  id,
  request,
}: DischargeAdmissionVariables): Promise<DischargeAdmissionResponse> {
  const response = await fetch(`/api/v1/admissions/${id}/discharge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not discharge the Admission');
  }

  return response.json() as Promise<DischargeAdmissionResponse>;
}

type UseDischargeAdmissionOptions = Omit<
  UseMutationOptions<DischargeAdmissionResponse, Error, DischargeAdmissionVariables>,
  'mutationFn'
>;

export function useDischargeAdmission(options?: UseDischargeAdmissionOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: dischargeAdmission,
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
