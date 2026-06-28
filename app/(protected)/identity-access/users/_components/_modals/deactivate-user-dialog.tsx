'use client';

import { UserRoundX } from 'lucide-react';
import { toast } from 'sonner';

import type { StaffWithRoles } from '@/app/api/lib/modules/staff/schemas/staff-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeactivateStaff } from '@/app/queries/identity-access/useDeactivateStaff';
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

type DeactivateUserDialogProps = {
  /** The Staff member pending deactivation, or null when the dialog is closed. */
  staff: StaffWithRoles | null;
  onClose: () => void;
  onDeactivated: (userId: string) => void;
};

export function DeactivateUserDialog({ staff, onClose, onDeactivated }: DeactivateUserDialogProps) {
  const deactivateMutation = useDeactivateStaff();

  async function handleConfirm() {
    if (!staff) {
      return;
    }

    try {
      await deactivateMutation.mutateAsync(staff.id);
      toast.success(`${staff.name} deactivated.`);
      onDeactivated(staff.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={staff !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <UserRoundX />
          </AlertDialogMedia>
          <AlertDialogTitle>Deactivate Staff member?</AlertDialogTitle>
          <AlertDialogDescription>
            {staff ? (
              <>
                This signs <strong>{staff.name}</strong> out of every device and blocks sign-in
                until reactivated. Their Staff record and Role assignments are kept.
              </>
            ) : (
              'This Staff member will be deactivated.'
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
