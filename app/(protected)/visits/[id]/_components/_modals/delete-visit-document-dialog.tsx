'use client';

import { toast } from 'sonner';

import type { VisitDocument } from '@/app/api/lib/modules/visit-document/schemas/visit-document-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteVisitDocument } from '@/app/queries/visits/useDeleteVisitDocument';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export function DeleteVisitDocumentDialog({
  visitId,
  document,
  onClose,
}: {
  visitId: number;
  document: VisitDocument | null;
  onClose: () => void;
}) {
  return (
    <AlertDialog open={document !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent>
        {document ? (
          <DeleteVisitDocumentBody visitId={visitId} document={document} onClose={onClose} />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteVisitDocumentBody({
  visitId,
  document,
  onClose,
}: {
  visitId: number;
  document: VisitDocument;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteVisitDocument();

  async function handleConfirm() {
    try {
      await deleteMutation.mutateAsync({ visitId, documentId: document.id });
      toast.success('Document removed.');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Remove {document.fileName}?</AlertDialogTitle>
        <AlertDialogDescription>
          The file is permanently deleted from this Visit and cannot be recovered.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={deleteMutation.isPending}>Keep document</AlertDialogCancel>
        <Button
          type="button"
          variant="destructive"
          disabled={deleteMutation.isPending}
          onClick={() => void handleConfirm()}
        >
          {deleteMutation.isPending ? 'Removing…' : 'Remove document'}
        </Button>
      </AlertDialogFooter>
    </>
  );
}
