'use client';

import { UserRoundX } from 'lucide-react';
import { toast } from 'sonner';

import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeactivatePatient } from '@/app/queries/patients/useDeactivatePatient';
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
  /** The Patient pending deactivation, or null when the dialog is closed. */
  patient: Patient | null;
  onClose: () => void;
};

export function DeactivatePatientDialog({ patient, onClose }: DeactivatePatientDialogProps) {
  const deactivateMutation = useDeactivatePatient();

  async function handleConfirm() {
    if (!patient) {
      return;
    }

    try {
      await deactivateMutation.mutateAsync(patient.id);
      toast.success(`${patient.firstName} ${patient.lastName} deactivated.`);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={patient !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <UserRoundX />
          </AlertDialogMedia>
          <AlertDialogTitle>Deactivate Patient?</AlertDialogTitle>
          <AlertDialogDescription>
            {patient ? (
              <>
                <strong>
                  {patient.firstName} {patient.lastName}
                </strong>{' '}
                (MRN {patient.mrn}) will no longer be eligible for new Appointments, Visits, or
                Admissions until reactivated. Their record and history are kept.
              </>
            ) : (
              'This Patient will be deactivated.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deactivateMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deactivateMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            Deactivate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
