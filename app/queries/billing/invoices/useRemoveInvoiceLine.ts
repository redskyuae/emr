'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { INVOICES_KEY } from './useInvoices';

type RemoveInvoiceLineVariables = {
  id: number;
  lineId: number;
};

async function removeInvoiceLine({ id, lineId }: RemoveInvoiceLineVariables): Promise<void> {
  const response = await fetch(`/api/v1/invoices/${id}/lines/${lineId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not remove the line');
  }
}

type UseRemoveInvoiceLineOptions = Omit<
  UseMutationOptions<void, Error, RemoveInvoiceLineVariables>,
  'mutationFn'
>;

export function useRemoveInvoiceLine(options?: UseRemoveInvoiceLineOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: removeInvoiceLine,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      await onSuccess?.(...args);
    },
  });
}
