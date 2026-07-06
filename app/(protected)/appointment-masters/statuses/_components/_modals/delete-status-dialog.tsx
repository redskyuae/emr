'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { AppointmentStatus } from '@/app/api/lib/modules/appointment-status/schemas/appointment-status-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteAppointmentStatus } from '@/app/queries/appointment-masters/statuses/useDeleteAppointmentStatus';
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

type StatusDeleteDialogProps = {
  status: AppointmentStatus | null;
  onClose: () => void;
  onDeleted: (statusId: number) => void;
};

export function StatusDeleteDialog({ status, onClose, onDeleted }: StatusDeleteDialogProps) {
  const deleteStatusMutation = useDeleteAppointmentStatus();

  async function handleConfirmDelete() {
    if (!status) {
      return;
    }

    try {
      await deleteStatusMutation.mutateAsync(status.id);
      toast.success('Appointment Status deleted.');
      onDeleted(status.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={status !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Appointment Status?</AlertDialogTitle>
          <AlertDialogDescription>
            {status ? (
              <>
                Delete Appointment Status &ldquo;
                <strong>{status.name}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              'This Appointment Status will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteStatusMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteStatusMutation.isPending}
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
