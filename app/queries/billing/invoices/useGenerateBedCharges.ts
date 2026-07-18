'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GenerateBedChargesResponse } from '@/app/api/v1/invoices/[id]/bed-charges/types';
import { INVOICES_KEY } from './useInvoices';

async function generateBedCharges(id: number): Promise<GenerateBedChargesResponse> {
  const response = await fetch(`/api/v1/invoices/${id}/bed-charges`, {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not generate Bed-Day Charges');
  }

  return response.json() as Promise<GenerateBedChargesResponse>;
}

type UseGenerateBedChargesOptions = Omit<
  UseMutationOptions<GenerateBedChargesResponse, Error, number>,
  'mutationFn'
>;

export function useGenerateBedCharges(options?: UseGenerateBedChargesOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: generateBedCharges,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      await onSuccess?.(...args);
    },
  });
}
