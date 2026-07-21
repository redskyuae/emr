'use client';

import { useState } from 'react';
import { Download, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { VisitDocument } from '@/app/api/lib/modules/visit-document/schemas/visit-document-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAddVisitDocument } from '@/app/queries/visits/useAddVisitDocument';
import { useVisitDocumentsQuery } from '@/app/queries/visits/useVisitDocuments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="shadow-fluent-2">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Documents this Visit</CardTitle>
        {active ? <VisitDocumentUploadButton label="Upload" onUploaded={handleUploaded} /> : null}
      </CardHeader>
      <CardContent>
        {documentsQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading documents…</p>
        ) : documentsQuery.isError ? (
          <p className="text-destructive text-sm">{getApiErrorMessage(documentsQuery.error)}</p>
        ) : documents.length === 0 ? (
          <p className="text-muted-foreground text-sm">No documents attached to this Visit.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {documents.map((document) => (
              <li key={document.id} className="flex items-center gap-2 rounded-md border p-2">
                <FileText className="text-muted-foreground size-4 shrink-0" />
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 flex-1 items-center gap-1 truncate font-medium hover:underline"
                >
                  <span className="truncate">{document.fileName}</span>
                  <Download className="size-3.5 shrink-0" />
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
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
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
