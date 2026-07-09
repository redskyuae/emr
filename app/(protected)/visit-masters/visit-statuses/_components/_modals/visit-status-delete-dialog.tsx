'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { VisitStatus } from '@/app/api/lib/modules/visit-status/schemas/visit-status-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteVisitStatus } from '@/app/queries/visit-masters/useDeleteVisitStatus';
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

type VisitStatusDeleteDialogProps = {
  status: VisitStatus | null;
  onClose: () => void;
  onDeleted: (statusId: number) => void;
};

export function VisitStatusDeleteDialog({
  status,
  onClose,
  onDeleted,
}: VisitStatusDeleteDialogProps) {
  const deleteMutation = useDeleteVisitStatus();

  async function handleConfirmDelete() {
    if (!status) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(status.id);
      toast.success('Visit Status deleted.');
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
          <AlertDialogTitle>Delete Visit Status?</AlertDialogTitle>
          <AlertDialogDescription>
            {status ? (
              <>
                Delete Visit Status &ldquo;<strong>{status.name}</strong>&rdquo;? This action cannot
                be undone.
              </>
            ) : (
              'This Visit Status will be deleted.'
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
