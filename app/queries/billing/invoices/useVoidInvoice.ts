'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  VoidInvoiceRequest,
  VoidInvoiceResponse,
} from '@/app/api/v1/invoices/[id]/void/types';
import { INVOICES_KEY } from './useInvoices';

type VoidInvoiceVariables = {
  id: number;
  request: VoidInvoiceRequest;
};

async function voidInvoice({ id, request }: VoidInvoiceVariables): Promise<VoidInvoiceResponse> {
  const response = await fetch(`/api/v1/invoices/${id}/void`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not void the Invoice');
  }

  return response.json() as Promise<VoidInvoiceResponse>;
}

type UseVoidInvoiceOptions = Omit<
  UseMutationOptions<VoidInvoiceResponse, Error, VoidInvoiceVariables>,
  'mutationFn'
>;

export function useVoidInvoice(options?: UseVoidInvoiceOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: voidInvoice,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      await onSuccess?.(...args);
    },
  });
}
