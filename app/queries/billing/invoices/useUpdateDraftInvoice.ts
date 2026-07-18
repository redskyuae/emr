'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { UpdateDraftInvoiceRequest, UpdateInvoiceResponse } from '@/app/api/v1/invoices/types';
import { INVOICES_KEY } from './useInvoices';

type UpdateDraftInvoiceVariables = {
  id: number;
  request: UpdateDraftInvoiceRequest;
};

async function updateDraftInvoice({
  id,
  request,
}: UpdateDraftInvoiceVariables): Promise<UpdateInvoiceResponse> {
  const response = await fetch(`/api/v1/invoices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update the Invoice');
  }

  return response.json() as Promise<UpdateInvoiceResponse>;
}

type UseUpdateDraftInvoiceOptions = Omit<
  UseMutationOptions<UpdateInvoiceResponse, Error, UpdateDraftInvoiceVariables>,
  'mutationFn'
>;

export function useUpdateDraftInvoice(options?: UseUpdateDraftInvoiceOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateDraftInvoice,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      await onSuccess?.(...args);
    },
  });
}
