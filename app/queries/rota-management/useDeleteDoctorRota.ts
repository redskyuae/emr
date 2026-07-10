'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { doctorRotaQueryKey } from './useDoctorRota';
import { doctorRotasQueryKey } from './useDoctorRotas';

async function deleteDoctorRota(id: number): Promise<void> {
  const response = await fetch(`/api/v1/doctor-rotas/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Doctor Rota');
  }
}

type UseDeleteDoctorRotaOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

export function useDeleteDoctorRota(options?: UseDeleteDoctorRotaOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteDoctorRota,
    onSuccess: async (...args) => {
      const [, id] = args;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: doctorRotasQueryKey }),
        queryClient.invalidateQueries({ queryKey: doctorRotaQueryKey(id) }),
      ]);
      await onSuccess?.(...args);
    },
  });
}
