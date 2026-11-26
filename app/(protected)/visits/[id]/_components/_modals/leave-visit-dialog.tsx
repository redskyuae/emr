'use client';

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

/** Asks before an in-app link takes the user away from a Visit with unsaved changes. */
export function LeaveVisitDialog({
  open,
  unsavedItems,
  onStay,
  onLeave,
}: {
  open: boolean;
  unsavedItems: string[];
  onStay: () => void;
  onLeave: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => (!next ? onStay() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>
            These changes are lost if you leave this Visit now. Stay to save them first.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {unsavedItems.length > 0 ? (
          <ul className="list-disc pl-5 text-sm">
            {unsavedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Stay on Visit</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onLeave}>
            Leave without saving
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
