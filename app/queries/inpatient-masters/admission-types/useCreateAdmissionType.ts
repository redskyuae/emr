'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveAdmissionTypeRequest,
  SaveAdmissionTypeResponse,
} from '@/app/api/v1/admission-types/types';
import { ADMISSION_TYPES_KEY } from './useAdmissionTypes';

async function createAdmissionType(
  request: SaveAdmissionTypeRequest
): Promise<SaveAdmissionTypeResponse> {
  const response = await fetch('/api/v1/admission-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Admission Type');
  }

  return response.json() as Promise<SaveAdmissionTypeResponse>;
}

type UseCreateAdmissionTypeOptions = Omit<
  UseMutationOptions<SaveAdmissionTypeResponse, Error, SaveAdmissionTypeRequest>,
  'mutationFn'
>;

export function useCreateAdmissionType(options?: UseCreateAdmissionTypeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createAdmissionType,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: ADMISSION_TYPES_KEY });
      await onSuccess?.(...args);
    },
  });
}
