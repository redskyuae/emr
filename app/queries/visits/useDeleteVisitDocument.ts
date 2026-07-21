'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { visitDocumentsQueryKey } from './useVisitDocuments';

type DeleteVisitDocumentVariables = {
  visitId: number;
  documentId: number;
};

async function deleteVisitDocument({
  visitId,
  documentId,
}: DeleteVisitDocumentVariables): Promise<void> {
  const response = await fetch(`/api/v1/visits/${visitId}/documents/${documentId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not remove the document');
  }
}

type UseDeleteVisitDocumentOptions = Omit<
  UseMutationOptions<void, Error, DeleteVisitDocumentVariables>,
  'mutationFn'
>;

export function useDeleteVisitDocument(options?: UseDeleteVisitDocumentOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteVisitDocument,
    onSuccess: async (...args) => {
      const [, { visitId }] = args;
      await queryClient.invalidateQueries({ queryKey: visitDocumentsQueryKey(visitId) });
      await onSuccess?.(...args);
    },
  });
}
