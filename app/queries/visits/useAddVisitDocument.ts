'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  AddVisitDocumentRequest,
  AddVisitDocumentResponse,
} from '@/app/api/v1/visits/[id]/documents/types';
import { visitDocumentsQueryKey } from './useVisitDocuments';

type AddVisitDocumentVariables = {
  visitId: number;
  request: AddVisitDocumentRequest;
};

async function addVisitDocument({
  visitId,
  request,
}: AddVisitDocumentVariables): Promise<AddVisitDocumentResponse> {
  const response = await fetch(`/api/v1/visits/${visitId}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not attach the document');
  }

  return response.json() as Promise<AddVisitDocumentResponse>;
}

type UseAddVisitDocumentOptions = Omit<
  UseMutationOptions<AddVisitDocumentResponse, Error, AddVisitDocumentVariables>,
  'mutationFn'
>;

export function useAddVisitDocument(options?: UseAddVisitDocumentOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: addVisitDocument,
    onSuccess: async (...args) => {
      const [, { visitId }] = args;
      await queryClient.invalidateQueries({ queryKey: visitDocumentsQueryKey(visitId) });
      await onSuccess?.(...args);
    },
  });
}
