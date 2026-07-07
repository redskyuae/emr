'use client';

import { UserRoundCheck, UserRoundX } from 'lucide-react';
import { toast } from 'sonner';

import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeactivatePatient } from '@/app/queries/patients/useDeactivatePatient';
import { useReactivatePatient } from '@/app/queries/patients/useReactivatePatient';
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

type DeactivatePatientDialogProps = {
  /** The Patient pending a lifecycle change, or null when the dialog is closed. Mode
   *  (deactivate vs. reactivate) is derived from the Patient's current `isActive`. */
  patient: Patient | null;
  onClose: () => void;
};

export function DeactivatePatientDialog({ patient, onClose }: DeactivatePatientDialogProps) {
  const deactivateMutation = useDeactivatePatient();
  const reactivateMutation = useReactivatePatient();
  const isDeactivating = patient?.isActive ?? true;
  const isPending = deactivateMutation.isPending || reactivateMutation.isPending;

  async function handleConfirm() {
    if (!patient) {
      return;
    }

    try {
      if (isDeactivating) {
        await deactivateMutation.mutateAsync(patient.id);
        toast.success(`${patient.firstName} ${patient.lastName} deactivated.`);
      } else {
        await reactivateMutation.mutateAsync(patient.id);
        toast.success(`${patient.firstName} ${patient.lastName} reactivated.`);
      }

      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={patient !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className={isDeactivating ? 'text-destructive' : undefined}>
            {isDeactivating ? <UserRoundX /> : <UserRoundCheck />}
          </AlertDialogMedia>
          <AlertDialogTitle>
            {isDeactivating ? 'Deactivate Patient?' : 'Reactivate Patient?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {patient ? (
              isDeactivating ? (
                <>
                  <strong>
                    {patient.firstName} {patient.lastName}
                  </strong>{' '}
                  (MRN {patient.mrn}) will no longer be eligible for new Appointments, Visits, or
                  Admissions until reactivated. Their record and history are kept.
                </>
              ) : (
                <>
                  <strong>
                    {patient.firstName} {patient.lastName}
                  </strong>{' '}
                  (MRN {patient.mrn}) will become eligible for new Appointments, Visits, and
                  Admissions again.
                </>
              )
            ) : (
              'This Patient will be updated.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={isDeactivating ? 'destructive' : 'default'}
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isDeactivating ? 'Deactivate' : 'Reactivate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
