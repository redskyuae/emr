'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  RecordPaymentRequest,
  RecordPaymentResponse,
} from '@/app/api/v1/invoices/[id]/payments/types';
import { INVOICES_KEY } from './useInvoices';

type RecordPaymentVariables = {
  id: number;
  request: RecordPaymentRequest;
};

async function recordPayment({
  id,
  request,
}: RecordPaymentVariables): Promise<RecordPaymentResponse> {
  const response = await fetch(`/api/v1/invoices/${id}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not record the Payment');
  }

  return response.json() as Promise<RecordPaymentResponse>;
}

type UseRecordPaymentOptions = Omit<
  UseMutationOptions<RecordPaymentResponse, Error, RecordPaymentVariables>,
  'mutationFn'
>;

export function useRecordPayment(options?: UseRecordPaymentOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: recordPayment,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      await onSuccess?.(...args);
    },
  });
}
