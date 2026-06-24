'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { RoleWithStats } from '@/app/api/lib/modules/role/schemas/role-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteRole } from '@/app/queries/identity-access/useDeleteRole';
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

type DeleteRoleDialogProps = {
  /** The Role pending deletion, or null when the dialog is closed. */
  role: RoleWithStats | null;
  onClose: () => void;
  onDeleted: (roleId: number) => void;
};

export function DeleteRoleDialog({ role, onClose, onDeleted }: DeleteRoleDialogProps) {
  const deleteRoleMutation = useDeleteRole();

  async function handleConfirmDelete() {
    if (!role) {
      return;
    }

    try {
      await deleteRoleMutation.mutateAsync(role.id);
      toast.success('Role deleted.');
      onDeleted(role.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={role !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Role?</AlertDialogTitle>
          <AlertDialogDescription>
            {role ? (
              <>
                This will delete <strong>{role.name}</strong>. Roles with active Role Assignments
                cannot be deleted.
              </>
            ) : (
              'This Role will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRoleMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteRoleMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirmDelete();
            }}
          >
            Delete Role
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
