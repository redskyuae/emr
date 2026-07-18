import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetInvoiceResponse } from '@/app/api/v1/invoices/types';

export const INVOICE_DETAIL_KEY = ['invoices', 'detail'] as const;

export const invoiceQueryKey = (id: number) => [...INVOICE_DETAIL_KEY, id] as const;

async function fetchInvoice(id: number): Promise<GetInvoiceResponse> {
  const response = await fetch(`/api/v1/invoices/${id}`, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load the Invoice');
  }

  return response.json() as Promise<GetInvoiceResponse>;
}

function transformInvoiceResponse(response: GetInvoiceResponse) {
  return response.data;
}

// Non-suspense: the detail screen refetches after every lifecycle mutation, and a
// refresh must not blow away the surrounding header and chrome.
export function useInvoiceQuery(id: number) {
  return useQuery({
    queryKey: invoiceQueryKey(id),
    queryFn: () => fetchInvoice(id),
    select: transformInvoiceResponse,
  });
}
