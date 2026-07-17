'use client';

import { toast } from 'sonner';

import type { Bed } from '@/app/api/lib/modules/bed/schemas/bed-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteBed } from '@/app/queries/inpatient-masters/beds/useDeleteBed';
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

export function DeleteBedDialog({ bed, onClose }: { bed: Bed | null; onClose: () => void }) {
  const deleteMutation = useDeleteBed();

  async function handleConfirm() {
    if (!bed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(bed.id);
      toast.success('Bed deleted.');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={bed !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {bed?.bedNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            An occupied Bed cannot be removed. Historical Admissions that used this Bed keep their
            records.
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
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
