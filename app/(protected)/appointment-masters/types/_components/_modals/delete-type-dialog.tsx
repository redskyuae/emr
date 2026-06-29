import { Trash2 } from 'lucide-react';

import type { AppointmentType } from '@/app/api/lib/modules/appointment-type/schemas/appointment-type-schema';
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

export function TypeDeleteDialog({
  type,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  type: AppointmentType | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={type !== null} onOpenChange={(open) => (!open ? onCancel() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Appointment Type?</AlertDialogTitle>
          <AlertDialogDescription>
            {type ? (
              <>
                Delete Appointment Type &ldquo;
                <strong>{type.name}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              'This Appointment Type will be deleted.'
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
