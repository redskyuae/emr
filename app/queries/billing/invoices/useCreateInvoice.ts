'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { CreateInvoiceRequest, SaveInvoiceResponse } from '@/app/api/v1/invoices/types';
import { INVOICES_KEY } from './useInvoices';

async function createInvoice(request: CreateInvoiceRequest): Promise<SaveInvoiceResponse> {
  const response = await fetch('/api/v1/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Invoice');
  }

  return response.json() as Promise<SaveInvoiceResponse>;
}

type UseCreateInvoiceOptions = Omit<
  UseMutationOptions<SaveInvoiceResponse, Error, CreateInvoiceRequest>,
  'mutationFn'
>;

export function useCreateInvoice(options?: UseCreateInvoiceOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createInvoice,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      await onSuccess?.(...args);
    },
  });
}
