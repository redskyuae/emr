'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { INVOICES_KEY } from './useInvoices';

async function deleteInvoice(id: number): Promise<void> {
  const response = await fetch(`/api/v1/invoices/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete the Invoice');
  }
}

type UseDeleteInvoiceOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

export function useDeleteInvoice(options?: UseDeleteInvoiceOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteInvoice,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      await onSuccess?.(...args);
    },
  });
}
