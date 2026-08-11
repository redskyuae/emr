import { Trash2 } from 'lucide-react';

import type { Language } from '@/app/queries/global-references/languages/useLanguages';
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

export function LanguageDeleteDialog({
  language,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  language: Language | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={language !== null} onOpenChange={(open) => (!open ? onCancel() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Language?</AlertDialogTitle>
          <AlertDialogDescription>
            {language ? (
              <>
                Delete Language &ldquo;
                <strong>{language.name}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              'This Language will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting || language === null}
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
