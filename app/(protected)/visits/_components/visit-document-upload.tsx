'use client';

import { useRef } from 'react';
import { CiExport } from 'react-icons/ci';
import { PiCircleNotchLight } from 'react-icons/pi';
import { toast } from 'sonner';

import type { UploadVisitDocumentResponse } from '@/app/api/v1/visits/documents/types';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { useUploadVisitDocument } from '@/app/queries/visits/useUploadVisitDocument';
import { Button } from '@/components/ui/button';

export type UploadedVisitDocument = UploadVisitDocumentResponse['data'];

// Kept in step with ACCEPTED_VISIT_DOCUMENT_TYPES on the server.
const ACCEPTED_TYPES = 'application/pdf,image/png,image/jpeg,image/webp,image/gif,image/tiff';

// A file picker that uploads each selected file to Blob and hands its metadata
// back. The caller decides what to do with it — collect it for a check-in, or
// persist it against an existing Visit. Hidden without `visit-document:upload`.
export function VisitDocumentUploadButton({
  onUploaded,
  disabled,
  label = 'Upload document',
}: {
  onUploaded: (document: UploadedVisitDocument) => void | Promise<void>;
  disabled?: boolean;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadVisitDocument();
  const { data: canUpload } = useHasPermission('visit-document:upload');

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    for (const file of Array.from(fileList)) {
      try {
        const result = await uploadMutation.mutateAsync(file);
        await onUploaded(result.data);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    }

    // Allow re-picking the same file after a failed or repeated upload.
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  if (!canUpload) {
    return null;
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || uploadMutation.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {uploadMutation.isPending ? (
          <PiCircleNotchLight className="size-4 animate-spin" />
        ) : (
          <CiExport className="size-4" />
        )}
        {uploadMutation.isPending ? 'Uploading…' : label}
      </Button>
    </>
  );
}
