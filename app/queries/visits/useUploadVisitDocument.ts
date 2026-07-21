'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { UploadVisitDocumentResponse } from '@/app/api/v1/visits/documents/types';

// Uploads one file to Blob and returns its metadata. Persisting the document
// against a Visit is a separate step (check-in payload or useAddVisitDocument),
// so this mutation touches no query cache.
async function uploadVisitDocument(file: File): Promise<UploadVisitDocumentResponse> {
  const body = new FormData();
  body.append('file', file);

  const response = await fetch('/api/v1/visits/documents', {
    method: 'POST',
    credentials: 'same-origin',
    body,
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not upload the document');
  }

  return response.json() as Promise<UploadVisitDocumentResponse>;
}

type UseUploadVisitDocumentOptions = Omit<
  UseMutationOptions<UploadVisitDocumentResponse, Error, File>,
  'mutationFn'
>;

export function useUploadVisitDocument(options?: UseUploadVisitDocumentOptions) {
  return useMutation({ ...options, mutationFn: uploadVisitDocument });
}
