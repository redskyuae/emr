'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AppointmentCancelledReason } from '@/app/api/lib/modules/appointment-cancelled-reason/schemas/appointment-cancelled-reason-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteAppointmentCancelledReason } from '@/app/queries/appointment-masters/cancelled-reasons/useDeleteAppointmentCancelledReason';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, } from '@/components/ui/alert-dialog';

type DeleteCancelledReasonDialogProps = {
  reason: AppointmentCancelledReason | null;
  onClose: () => void;
  onDeleted: (reasonId: number) => void;
};

export function DeleteCancelledReasonDialog({
  reason,
  onClose,
  onDeleted,
}: DeleteCancelledReasonDialogProps) {
  const deleteMutation = useDeleteAppointmentCancelledReason();

  async function handleConfirmDelete() {
    if (!reason) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(reason.id);
      toast.success('Appointment Cancelled Reason deleted.');
      onDeleted(reason.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={reason !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Appointment Cancelled Reason?</AlertDialogTitle>
          <AlertDialogDescription>
            {reason ? (
              <>
                Delete Appointment Cancelled Reason &ldquo;
                <strong>{reason.name}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              'This Appointment Cancelled Reason will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirmDelete();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
