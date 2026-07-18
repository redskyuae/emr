'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { FinalizeInvoiceResponse } from '@/app/api/v1/invoices/[id]/finalize/types';
import { INVOICES_KEY } from './useInvoices';

async function finalizeInvoice(id: number): Promise<FinalizeInvoiceResponse> {
  const response = await fetch(`/api/v1/invoices/${id}/finalize`, {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not finalize the Invoice');
  }

  return response.json() as Promise<FinalizeInvoiceResponse>;
}

type UseFinalizeInvoiceOptions = Omit<
  UseMutationOptions<FinalizeInvoiceResponse, Error, number>,
  'mutationFn'
>;

export function useFinalizeInvoice(options?: UseFinalizeInvoiceOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: finalizeInvoice,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      await onSuccess?.(...args);
    },
  });
}
