'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateAdmissionTypeRequest,
  UpdateAdmissionTypeResponse,
} from '@/app/api/v1/admission-types/[id]/types';
import { ADMISSION_TYPES_KEY } from './useAdmissionTypes';

type UpdateAdmissionTypeVariables = {
  id: number;
  request: UpdateAdmissionTypeRequest;
};

async function updateAdmissionType({
  id,
  request,
}: UpdateAdmissionTypeVariables): Promise<UpdateAdmissionTypeResponse> {
  const response = await fetch(`/api/v1/admission-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Admission Type');
  }

  return response.json() as Promise<UpdateAdmissionTypeResponse>;
}

type UseUpdateAdmissionTypeOptions = Omit<
  UseMutationOptions<UpdateAdmissionTypeResponse, Error, UpdateAdmissionTypeVariables>,
  'mutationFn'
>;

export function useUpdateAdmissionType(options?: UseUpdateAdmissionTypeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateAdmissionType,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: ADMISSION_TYPES_KEY });
      await onSuccess?.(...args);
    },
  });
}
