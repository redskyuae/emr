'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  TransferBedRequest,
  TransferBedResponse,
} from '@/app/api/v1/admissions/[id]/transfer/types';
import { BEDS_KEY } from '@/app/queries/inpatient-masters/beds/useBeds';
import { admissionQueryKey } from './useAdmission';
import { ADMISSIONS_KEY } from './useAdmissions';

type TransferBedVariables = {
  id: number;
  request: TransferBedRequest;
};

async function transferBed({ id, request }: TransferBedVariables): Promise<TransferBedResponse> {
  const response = await fetch(`/api/v1/admissions/${id}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not transfer the Admission');
  }

  return response.json() as Promise<TransferBedResponse>;
}

type UseTransferBedOptions = Omit<
  UseMutationOptions<TransferBedResponse, Error, TransferBedVariables>,
  'mutationFn'
>;

export function useTransferBed(options?: UseTransferBedOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: transferBed,
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
