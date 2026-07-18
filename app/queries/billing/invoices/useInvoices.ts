import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListInvoicesResponse } from '@/app/api/v1/invoices/types';

export type InvoicesParams = {
  query?: string;
  page?: number;
  limit?: number;
  status?: string;
  patientId?: number;
};

export const INVOICES_KEY = ['invoices'] as const;

export const invoicesQueryKey = (params: InvoicesParams) =>
  [...INVOICES_KEY, 'list', params] as const;

async function fetchInvoices(params: InvoicesParams): Promise<ListInvoicesResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);
  if (params.status) searchParams.set('status', params.status);
  if (params.patientId) searchParams.set('patientId', String(params.patientId));

  const response = await fetch(`/api/v1/invoices?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Invoices');
  }

  return response.json() as Promise<ListInvoicesResponse>;
}

// Non-suspense: the list's status/patient filters drive this query, and switching
// a filter must not blow away the surrounding toolbar and chrome.
export function useInvoicesQuery(params: InvoicesParams) {
  return useQuery({
    queryKey: invoicesQueryKey(params),
    queryFn: () => fetchInvoices(params),
  });
}

export function useInvoices(params: InvoicesParams) {
  return useSuspenseQuery({
    queryKey: invoicesQueryKey(params),
    queryFn: () => fetchInvoices(params),
  });
}
