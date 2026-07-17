'use client';

import { toast } from 'sonner';

import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteVisitType } from '@/app/queries/visit-masters/visit-types/useDeleteVisitType';
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

export function DeleteVisitTypeDialog({
  visitType,
  onClose,
}: {
  visitType: VisitType | null;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteVisitType();

  async function handleConfirm() {
    if (!visitType) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(visitType.id);
      toast.success('Visit Type deleted.');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={visitType !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {visitType?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This Visit Type will no longer be available when checking a Patient in. Visits already
            classified with it keep their history.
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
            {deleteMutation.isPending ? 'Deleting…' : 'Delete Visit Type'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
