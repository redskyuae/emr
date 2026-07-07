'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { AppointmentReason } from '@/app/api/lib/modules/appointment-reason/schemas/appointment-reason-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteAppointmentReason } from '@/app/queries/appointment-masters/reasons/useDeleteAppointmentReason';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ReasonDeleteDialogProps = {
  reason: AppointmentReason | null;
  onClose: () => void;
  onDeleted: (reasonId: number) => void;
};

export function ReasonDeleteDialog({ reason, onClose, onDeleted }: ReasonDeleteDialogProps) {
  const deleteReasonMutation = useDeleteAppointmentReason();

  async function handleConfirmDelete() {
    if (!reason) {
      return;
    }

    try {
      await deleteReasonMutation.mutateAsync(reason.id);
      toast.success('Appointment Reason deleted.');
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
          <AlertDialogTitle>Delete Appointment Reason?</AlertDialogTitle>
          <AlertDialogDescription>
            {reason ? (
              <>
                Delete Appointment Reason &ldquo;
                <strong>{reason.name}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              'This Appointment Reason will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteReasonMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteReasonMutation.isPending}
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
