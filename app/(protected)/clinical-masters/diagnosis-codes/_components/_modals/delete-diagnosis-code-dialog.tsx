'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { DiagnosisCode } from '@/app/api/lib/modules/diagnosis-code/schemas/diagnosis-code-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteDiagnosisCode } from '@/app/queries/clinical-masters/diagnosis-codes/useDeleteDiagnosisCode';
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

type DeleteDiagnosisCodeDialogProps = {
  diagnosisCode: DiagnosisCode | null;
  onClose: () => void;
  onDeleted: (diagnosisCodeId: number) => void;
};

export function DeleteDiagnosisCodeDialog({
  diagnosisCode,
  onClose,
  onDeleted,
}: DeleteDiagnosisCodeDialogProps) {
  const deleteDiagnosisCodeMutation = useDeleteDiagnosisCode();

  async function handleConfirmDelete() {
    if (!diagnosisCode) {
      return;
    }

    try {
      await deleteDiagnosisCodeMutation.mutateAsync(diagnosisCode.id);
      toast.success('Diagnosis Code deleted.');
      onDeleted(diagnosisCode.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog
      open={diagnosisCode !== null}
      onOpenChange={(open) => (!open ? onClose() : undefined)}
    >
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Diagnosis Code?</AlertDialogTitle>
          <AlertDialogDescription>
            {diagnosisCode ? (
              <>
                Delete Diagnosis Code &ldquo;
                <strong>{diagnosisCode.code}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              'This Diagnosis Code will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteDiagnosisCodeMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteDiagnosisCodeMutation.isPending}
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
