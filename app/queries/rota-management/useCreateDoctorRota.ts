'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import type {
  SaveDoctorRotaRequest,
  SaveDoctorRotaResponse,
} from '@/app/api/v1/doctor-rotas/types';
import { parseApiError } from '@/app/queries/api-error';
import { doctorRotasQueryKey } from './useDoctorRotas';

async function createDoctorRota(request: SaveDoctorRotaRequest): Promise<SaveDoctorRotaResponse> {
  const response = await fetch('/api/v1/doctor-rotas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Doctor Rota');
  }

  return response.json() as Promise<SaveDoctorRotaResponse>;
}

type UseCreateDoctorRotaOptions = Omit<
  UseMutationOptions<SaveDoctorRotaResponse, Error, SaveDoctorRotaRequest>,
  'mutationFn'
>;

export function useCreateDoctorRota(options?: UseCreateDoctorRotaOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createDoctorRota,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: doctorRotasQueryKey });
      await onSuccess?.(...args);
    },
  });
}
