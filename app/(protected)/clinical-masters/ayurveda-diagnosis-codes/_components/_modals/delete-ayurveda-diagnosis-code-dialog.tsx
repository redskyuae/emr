'use client';

import { toast } from 'sonner';

import type { AyurvedaDiagnosisCode } from '@/app/api/lib/modules/ayurveda-diagnosis-code/schemas/ayurveda-diagnosis-code-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteAyurvedaDiagnosisCode } from '@/app/queries/clinical-masters/ayurveda-diagnosis-codes/useDeleteAyurvedaDiagnosisCode';
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

export function DeleteAyurvedaDiagnosisCodeDialog({
  ayurvedaDiagnosisCode,
  onClose,
}: {
  ayurvedaDiagnosisCode: AyurvedaDiagnosisCode | null;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteAyurvedaDiagnosisCode();

  async function handleConfirm() {
    if (!ayurvedaDiagnosisCode) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(ayurvedaDiagnosisCode.id);
      toast.success('Ayurveda Diagnosis Code deleted.');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog
      open={ayurvedaDiagnosisCode !== null}
      onOpenChange={(open) => (!open ? onClose() : undefined)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {ayurvedaDiagnosisCode?.code} {ayurvedaDiagnosisCode?.name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This Ayurveda Diagnosis Code will no longer be available when recording a diagnosis.
            Visits already recorded with it keep their history.
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
            {deleteMutation.isPending ? 'Deleting…' : 'Delete Ayurveda Diagnosis Code'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
