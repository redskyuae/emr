'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteVisit } from '@/app/queries/visits/useDeleteVisit';
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

type DeleteVisitDialogProps = {
  visit: Visit | null;
  onClose: () => void;
  onDeleted?: (visitId: number) => void;
};

export function DeleteVisitDialog({ visit, onClose, onDeleted }: DeleteVisitDialogProps) {
  const deleteMutation = useDeleteVisit();

  async function handleConfirmDelete() {
    if (!visit) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(visit.id);
      toast.success('Visit deleted.');
      onDeleted?.(visit.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={visit !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Visit?</AlertDialogTitle>
          <AlertDialogDescription>
            {visit ? (
              <>
                Delete Visit <strong>{visit.visitNumber}</strong> for{' '}
                <strong>{visit.patient.name}</strong>? This action cannot be undone.
              </>
            ) : (
              'This Visit will be deleted.'
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
