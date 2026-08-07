import { Trash2 } from 'lucide-react';

import type { GlobalReferenceEntity } from '@/app/queries/global-references/useGlobalReferencesManagement';
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

export function StateDeleteDialog({
  state,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  state: GlobalReferenceEntity | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={state !== null} onOpenChange={(open) => (!open ? onCancel() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete State?</AlertDialogTitle>
          <AlertDialogDescription>
            {state ? (
              <>
                Delete State &ldquo;
                <strong>{state.name}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              'This State will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting || state === null}
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
