'use client';

import { CircleOff, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import type { Doctor } from '@/app/api/lib/modules/doctor/schemas/doctor-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeactivateDoctor } from '@/app/queries/doctors/useDeactivateDoctor';
import { useReactivateDoctor } from '@/app/queries/doctors/useReactivateDoctor';
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
import type { DoctorStatusAction } from '../doctor-views';

type PendingDoctorStatusAction = {
  doctor: Doctor;
  action: DoctorStatusAction;
};

type DoctorStatusDialogProps = {
  pendingAction: PendingDoctorStatusAction | null;
  onClose: () => void;
};

export function DoctorStatusDialog({ pendingAction, onClose }: DoctorStatusDialogProps) {
  const deactivateMutation = useDeactivateDoctor();
  const reactivateMutation = useReactivateDoctor();
  const isPending = deactivateMutation.isPending || reactivateMutation.isPending;
  const isDeactivate = pendingAction?.action === 'deactivate';

  async function handleConfirm() {
    if (!pendingAction) {
      return;
    }

    try {
      if (pendingAction.action === 'deactivate') {
        await deactivateMutation.mutateAsync(pendingAction.doctor.id);
        toast.success('Doctor deactivated.');
      } else {
        await reactivateMutation.mutateAsync(pendingAction.doctor.id);
        toast.success('Doctor reactivated.');
      }

      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog
      open={pendingAction !== null}
      onOpenChange={(open) => (!open ? onClose() : undefined)}
    >
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className={isDeactivate ? 'text-destructive' : 'text-primary'}>
            {isDeactivate ? <CircleOff /> : <RotateCcw />}
          </AlertDialogMedia>
          <AlertDialogTitle>
            {isDeactivate ? 'Deactivate Doctor?' : 'Reactivate Doctor?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {pendingAction ? (
              <>
                {isDeactivate ? 'Deactivate' : 'Reactivate'} Doctor &ldquo;
                <strong>{pendingAction.doctor.name}</strong>&rdquo;? This also updates the linked
                Staff lifecycle and login access.
              </>
            ) : (
              'Update this Doctor status?'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={isDeactivate ? 'destructive' : 'default'}
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isDeactivate ? 'Deactivate' : 'Reactivate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
