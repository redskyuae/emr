'use client';

import { useState } from 'react';
import { CiFileOn, CiImport, CiTrash } from 'react-icons/ci';
import { PiFilesDuotone } from 'react-icons/pi';
import { toast } from 'sonner';

import type { VisitDocument } from '@/app/api/lib/modules/visit-document/schemas/visit-document-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAddVisitDocument } from '@/app/queries/visits/useAddVisitDocument';
import { useVisitDocumentsQuery } from '@/app/queries/visits/useVisitDocuments';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatFileSize } from '../../_utils/format-file-size';
import { VisitDocumentUploadButton } from '../../_components/visit-document-upload';
import { DeleteVisitDocumentDialog } from './_modals/delete-visit-document-dialog';

export function VisitDocumentsCard({ visitId, active }: { visitId: number; active: boolean }) {
  const documentsQuery = useVisitDocumentsQuery(visitId);
  const addMutation = useAddVisitDocument();
  const [pendingDelete, setPendingDelete] = useState<VisitDocument | null>(null);

  const documents = documentsQuery.data ?? [];

  async function handleUploaded(
    metadata: Parameters<typeof addMutation.mutateAsync>[0]['request']
  ) {
    try {
      await addMutation.mutateAsync({ visitId, request: metadata });
      toast.success('Document added.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base">Documents this Visit</CardTitle>
        {active ? <VisitDocumentUploadButton label="Upload" onUploaded={handleUploaded} /> : null}
      </CardHeader>
      <CardContent>
        {documentsQuery.isError ? (
          <p className="text-destructive text-sm">{getApiErrorMessage(documentsQuery.error)}</p>
        ) : (
          <SkeletonCrossfade
            isLoading={documentsQuery.isLoading}
            skeleton={
              <ul className="space-y-2" aria-label="Loading Visit documents">
                {Array.from({ length: 3 }, (_, index) => (
                  <li key={index} className="flex items-center gap-2 rounded-md border p-2">
                    <Skeleton className="size-4 shrink-0" />
                    <Skeleton className="h-4 max-w-56 flex-1" />
                    <Skeleton className="ml-auto h-3 w-12" />
                    {active ? <Skeleton className="size-7 shrink-0" /> : null}
                  </li>
                ))}
              </ul>
            }
          >
            {documents.length === 0 ? (
              <EmptyState
                size="sm"
                tone="blue"
                icon={PiFilesDuotone}
                title="No documents yet"
                className="min-h-56 rounded-lg border border-dashed"
                description="Upload reports, images, or other files for this Visit."
              />
            ) : (
              <ul className="space-y-2 text-sm">
                {documents.map((document) => (
                  <li key={document.id} className="flex items-center gap-2 rounded-md border p-2">
                    <CiFileOn className="text-muted-foreground size-4 shrink-0" />
                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 flex-1 items-center gap-1 truncate font-medium hover:underline"
                    >
                      <span className="truncate">{document.fileName}</span>
                      <CiImport className="size-3.5 shrink-0" />
                    </a>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {formatFileSize(document.fileSize)}
                    </span>
                    {active ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive size-7 shrink-0"
                        aria-label={`Remove ${document.fileName}`}
                        onClick={() => setPendingDelete(document)}
                      >
                        <CiTrash className="size-4" />
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </SkeletonCrossfade>
        )}
      </CardContent>

      <DeleteVisitDocumentDialog
        visitId={visitId}
        document={pendingDelete}
        onClose={() => setPendingDelete(null)}
      />
    </Card>
  );
}
