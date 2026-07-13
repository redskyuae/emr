'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import type {
  UpdateDoctorRotaRequest,
  UpdateDoctorRotaResponse,
} from '@/app/api/v1/doctor-rotas/[id]/types';
import { parseApiError } from '@/app/queries/api-error';
import { doctorRotaQueryKey } from './useDoctorRota';
import { doctorRotasQueryKey } from './useDoctorRotas';

type UpdateDoctorRotaVariables = {
  id: number;
  request: UpdateDoctorRotaRequest;
};

async function updateDoctorRota({
  id,
  request,
}: UpdateDoctorRotaVariables): Promise<UpdateDoctorRotaResponse> {
  const response = await fetch(`/api/v1/doctor-rotas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Doctor Rota');
  }

  return response.json() as Promise<UpdateDoctorRotaResponse>;
}

type UseUpdateDoctorRotaOptions = Omit<
  UseMutationOptions<UpdateDoctorRotaResponse, Error, UpdateDoctorRotaVariables>,
  'mutationFn'
>;

export function useUpdateDoctorRota(options?: UseUpdateDoctorRotaOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateDoctorRota,
    onSuccess: async (...args) => {
      const [, variables] = args;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: doctorRotasQueryKey }),
        queryClient.invalidateQueries({ queryKey: doctorRotaQueryKey(variables.id) }),
      ]);
      await onSuccess?.(...args);
    },
  });
}
