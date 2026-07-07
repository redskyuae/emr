'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeletePatient } from '@/app/queries/patients/useDeletePatient';
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

type DeletePatientDialogProps = {
  /** The Patient pending deletion, or null when the dialog is closed. */
  patient: Patient | null;
  onClose: () => void;
};

export function DeletePatientDialog({ patient, onClose }: DeletePatientDialogProps) {
  const router = useRouter();
  const deleteMutation = useDeletePatient();

  async function handleConfirm() {
    if (!patient) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(patient.id);
      toast.success(`${patient.firstName} ${patient.lastName} deleted.`);
      onClose();
      router.push('/patients');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={patient !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Patient?</AlertDialogTitle>
          <AlertDialogDescription>
            {patient ? (
              <>
                This permanently removes{' '}
                <strong>
                  {patient.firstName} {patient.lastName}
                </strong>{' '}
                (MRN {patient.mrn}) from the Patient registry. This cannot be undone.
              </>
            ) : (
              'This Patient will be deleted.'
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
              void handleConfirm();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
