import { Trash2 } from 'lucide-react';

import type { Religion } from '@/app/queries/global-references/religions/useReligions';
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

export function ReligionDeleteDialog({
  religion,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  religion: Religion | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={religion !== null} onOpenChange={(open) => (!open ? onCancel() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Religion?</AlertDialogTitle>
          <AlertDialogDescription>
            {religion ? (
              <>
                Delete Religion &ldquo;
                <strong>{religion.name}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              'This Religion will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting || religion === null}
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
