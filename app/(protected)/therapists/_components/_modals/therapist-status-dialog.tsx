'use client';

import { CircleOff, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeactivateTherapist } from '@/app/queries/therapists/useDeactivateTherapist';
import { useReactivateTherapist } from '@/app/queries/therapists/useReactivateTherapist';
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
import type { TherapistStatusAction } from '../therapist-views';

type PendingTherapistStatusAction = {
  therapist: Therapist;
  action: TherapistStatusAction;
};

type TherapistStatusDialogProps = {
  pendingAction: PendingTherapistStatusAction | null;
  onClose: () => void;
};

export function TherapistStatusDialog({ pendingAction, onClose }: TherapistStatusDialogProps) {
  const deactivateMutation = useDeactivateTherapist();
  const reactivateMutation = useReactivateTherapist();
  const isPending = deactivateMutation.isPending || reactivateMutation.isPending;
  const isDeactivate = pendingAction?.action === 'deactivate';

  async function handleConfirm() {
    if (!pendingAction) {
      return;
    }

    try {
      if (pendingAction.action === 'deactivate') {
        await deactivateMutation.mutateAsync(pendingAction.therapist.id);
        toast.success('Therapist deactivated.');
      } else {
        await reactivateMutation.mutateAsync(pendingAction.therapist.id);
        toast.success('Therapist reactivated.');
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
            {isDeactivate ? 'Deactivate Therapist?' : 'Reactivate Therapist?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {pendingAction ? (
              <>
                {isDeactivate ? 'Deactivate' : 'Reactivate'} Therapist &ldquo;
                <strong>{pendingAction.therapist.name}</strong>&rdquo;?{' '}
                {isDeactivate
                  ? 'They will no longer be available for new Procedure Appointments.'
                  : 'They will be available for Procedure Appointments again.'}
              </>
            ) : (
              'Update this Therapist status?'
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
