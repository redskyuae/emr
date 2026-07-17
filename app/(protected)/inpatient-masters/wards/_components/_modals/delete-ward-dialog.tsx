'use client';

import { toast } from 'sonner';

import type { Ward } from '@/app/api/lib/modules/ward/schemas/ward-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteWard } from '@/app/queries/inpatient-masters/wards/useDeleteWard';
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

export function DeleteWardDialog({ ward, onClose }: { ward: Ward | null; onClose: () => void }) {
  const deleteMutation = useDeleteWard();

  async function handleConfirm() {
    if (!ward) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(ward.id);
      toast.success('Ward deleted.');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={ward !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {ward?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            A Ward with Beds assigned cannot be removed. Historical Admissions in this Ward keep
            their records.
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
            {deleteMutation.isPending ? 'Deleting…' : 'Delete Ward'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
