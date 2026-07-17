'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { ADMISSION_TYPES_KEY } from './useAdmissionTypes';

async function deleteAdmissionType(id: number): Promise<void> {
  const response = await fetch(`/api/v1/admission-types/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Admission Type');
  }
}

type UseDeleteAdmissionTypeOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

export function useDeleteAdmissionType(options?: UseDeleteAdmissionTypeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteAdmissionType,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: ADMISSION_TYPES_KEY });
      await onSuccess?.(...args);
    },
  });
}
