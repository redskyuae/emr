'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  AddInvoiceLineRequest,
  AddInvoiceLineResponse,
} from '@/app/api/v1/invoices/[id]/lines/types';
import { INVOICES_KEY } from './useInvoices';

type AddInvoiceLineVariables = {
  id: number;
  request: AddInvoiceLineRequest;
};

async function addInvoiceLine({
  id,
  request,
}: AddInvoiceLineVariables): Promise<AddInvoiceLineResponse> {
  const response = await fetch(`/api/v1/invoices/${id}/lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not add the line');
  }

  return response.json() as Promise<AddInvoiceLineResponse>;
}

type UseAddInvoiceLineOptions = Omit<
  UseMutationOptions<AddInvoiceLineResponse, Error, AddInvoiceLineVariables>,
  'mutationFn'
>;

export function useAddInvoiceLine(options?: UseAddInvoiceLineOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: addInvoiceLine,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      await onSuccess?.(...args);
    },
  });
}
