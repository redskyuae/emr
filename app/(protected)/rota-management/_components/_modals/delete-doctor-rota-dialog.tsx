'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { DoctorRota } from '@/app/api/lib/modules/doctor-rota/schemas/doctor-rota-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteDoctorRota } from '@/app/queries/rota-management/useDeleteDoctorRota';
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

type DeleteDoctorRotaDialogProps = {
  rota: DoctorRota | null;
  onClose: () => void;
  onDeleted: (rotaId: number) => void;
};

export function DeleteDoctorRotaDialog({ rota, onClose, onDeleted }: DeleteDoctorRotaDialogProps) {
  const deleteMutation = useDeleteDoctorRota();

  async function handleConfirmDelete() {
    if (!rota) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(rota.id);
      toast.success('Doctor Rota deleted.');
      onDeleted(rota.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={rota !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Doctor Rota?</AlertDialogTitle>
          <AlertDialogDescription>
            {rota ? (
              <>
                Delete Doctor Rota &ldquo;
                <strong>{rota.name}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              'This Doctor Rota will be deleted.'
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
