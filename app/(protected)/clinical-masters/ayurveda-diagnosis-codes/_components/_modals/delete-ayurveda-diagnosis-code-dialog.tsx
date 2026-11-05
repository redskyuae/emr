'use client';

import { Trash2 } from 'lucide-react';
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
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type DeleteAyurvedaDiagnosisCodeDialogProps = {
  ayurvedaDiagnosisCode: AyurvedaDiagnosisCode | null;
  onClose: () => void;
  onDeleted: (ayurvedaDiagnosisCodeId: number) => void;
};

export function DeleteAyurvedaDiagnosisCodeDialog({
  ayurvedaDiagnosisCode,
  onClose,
  onDeleted,
}: DeleteAyurvedaDiagnosisCodeDialogProps) {
  const deleteAyurvedaDiagnosisCodeMutation = useDeleteAyurvedaDiagnosisCode();

  async function handleConfirmDelete() {
    if (!ayurvedaDiagnosisCode) {
      return;
    }

    try {
      await deleteAyurvedaDiagnosisCodeMutation.mutateAsync(ayurvedaDiagnosisCode.id);
      toast.success('Ayurveda Diagnosis Code deleted.');
      onDeleted(ayurvedaDiagnosisCode.id);
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
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Ayurveda Diagnosis Code?</AlertDialogTitle>
          <AlertDialogDescription>
            {ayurvedaDiagnosisCode ? (
              <>
                Delete Ayurveda Diagnosis Code &ldquo;
                <strong>{ayurvedaDiagnosisCode.code}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              'This Ayurveda Diagnosis Code will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteAyurvedaDiagnosisCodeMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteAyurvedaDiagnosisCodeMutation.isPending}
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
