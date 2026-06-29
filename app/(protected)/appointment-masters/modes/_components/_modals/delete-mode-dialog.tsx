import { Trash2 } from 'lucide-react';

import type { AppointmentMode } from '@/app/api/lib/modules/appointment-mode/schemas/appointment-mode-schema';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, } from '@/components/ui/alert-dialog';

export function ModeDeleteDialog({
  mode,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  mode: AppointmentMode | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog
      open={mode !== null}
      onOpenChange={(open) => (!open ? onCancel() : undefined)}
    >
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Appointment Mode?</AlertDialogTitle>
          <AlertDialogDescription>
            {mode ? (
              <>
                Delete Appointment Mode &ldquo;
                <strong>{mode.name}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              'This Appointment Mode will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
