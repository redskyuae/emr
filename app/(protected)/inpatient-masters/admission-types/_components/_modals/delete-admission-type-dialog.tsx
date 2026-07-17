'use client';

import { toast } from 'sonner';

import type { AdmissionType } from '@/app/api/lib/modules/admission-type/schemas/admission-type-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteAdmissionType } from '@/app/queries/inpatient-masters/admission-types/useDeleteAdmissionType';
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

export function DeleteAdmissionTypeDialog({
  admissionType,
  onClose,
}: {
  admissionType: AdmissionType | null;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteAdmissionType();

  async function handleConfirm() {
    if (!admissionType) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(admissionType.id);
      toast.success('Admission Type deleted.');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog
      open={admissionType !== null}
      onOpenChange={(open) => (!open ? onClose() : undefined)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {admissionType?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This Admission Type will no longer be available when admitting a Patient. Admissions
            already classified with it keep their history.
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
            {deleteMutation.isPending ? 'Deleting…' : 'Delete Admission Type'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
