'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateAdmissionRequest,
  UpdateAdmissionResponse,
} from '@/app/api/v1/admissions/[id]/types';
import { BEDS_KEY } from '@/app/queries/inpatient-masters/beds/useBeds';
import { admissionQueryKey } from './useAdmission';
import { ADMISSIONS_KEY } from './useAdmissions';

type UpdateAdmissionVariables = {
  id: number;
  request: UpdateAdmissionRequest;
};

async function updateAdmission({
  id,
  request,
}: UpdateAdmissionVariables): Promise<UpdateAdmissionResponse> {
  const response = await fetch(`/api/v1/admissions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update the Admission');
  }

  return response.json() as Promise<UpdateAdmissionResponse>;
}

type UseUpdateAdmissionOptions = Omit<
  UseMutationOptions<UpdateAdmissionResponse, Error, UpdateAdmissionVariables>,
  'mutationFn'
>;

export function useUpdateAdmission(options?: UseUpdateAdmissionOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateAdmission,
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
