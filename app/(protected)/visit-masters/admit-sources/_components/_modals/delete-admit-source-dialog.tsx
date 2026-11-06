'use client';

import { toast } from 'sonner';

import type { AdmitSource } from '@/app/api/lib/modules/admit-source/schemas/admit-source-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteAdmitSource } from '@/app/queries/visit-masters/admit-sources/useDeleteAdmitSource';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function DeleteAdmitSourceDialog({
  admitSource,
  onClose,
}: {
  admitSource: AdmitSource | null;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteAdmitSource();

  async function handleConfirm() {
    if (!admitSource) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(admitSource.id);
      toast.success('Admit Source deleted.');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog
      open={admitSource !== null}
      onOpenChange={(open) => (!open ? onClose() : undefined)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {admitSource?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This Admit Source will no longer be available when checking a Patient in. Visits already
            recorded with it keep their history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete Admit Source'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
