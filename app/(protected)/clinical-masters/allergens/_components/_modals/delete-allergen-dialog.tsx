'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { Allergen } from '@/app/api/lib/modules/allergen/schemas/allergen-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteAllergen } from '@/app/queries/clinical-masters/allergens/useDeleteAllergen';
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

type DeleteAllergenDialogProps = {
  allergen: Allergen | null;
  onClose: () => void;
  onDeleted: (allergenId: number) => void;
};

export function DeleteAllergenDialog({ allergen, onClose, onDeleted }: DeleteAllergenDialogProps) {
  const deleteAllergenMutation = useDeleteAllergen();

  async function handleConfirmDelete() {
    if (!allergen) {
      return;
    }

    try {
      await deleteAllergenMutation.mutateAsync(allergen.id);
      toast.success('Allergen deleted.');
      onDeleted(allergen.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={allergen !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Allergen?</AlertDialogTitle>
          <AlertDialogDescription>
            {allergen ? (
              <>
                Delete Allergen &ldquo;
                <strong>{allergen.name}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              'This Allergen will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteAllergenMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteAllergenMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirmDelete();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
