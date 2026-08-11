import { Trash2 } from 'lucide-react';

import type { Nationality } from '@/app/queries/global-references/nationalities/useNationalities';
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

export function NationalityDeleteDialog({
  nationality,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  nationality: Nationality | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog
      open={nationality !== null}
      onOpenChange={(open) => (!open ? onCancel() : undefined)}
    >
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Nationality?</AlertDialogTitle>
          <AlertDialogDescription>
            {nationality ? (
              <>
                Delete Nationality &ldquo;
                <strong>{nationality.name}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              'This Nationality will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting || nationality === null}
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
