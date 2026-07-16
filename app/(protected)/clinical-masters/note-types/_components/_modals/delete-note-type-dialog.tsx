'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { ClinicalNoteType } from '@/app/api/lib/modules/clinical-note-type/schemas/clinical-note-type-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteClinicalNoteType } from '@/app/queries/clinical-masters/note-types/useDeleteClinicalNoteType';
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

type DeleteNoteTypeDialogProps = {
  noteType: ClinicalNoteType | null;
  onClose: () => void;
  onDeleted: (noteTypeId: number) => void;
};

export function DeleteNoteTypeDialog({ noteType, onClose, onDeleted }: DeleteNoteTypeDialogProps) {
  const deleteNoteTypeMutation = useDeleteClinicalNoteType();

  async function handleConfirmDelete() {
    if (!noteType) {
      return;
    }

    try {
      await deleteNoteTypeMutation.mutateAsync(noteType.id);
      toast.success('Clinical Note Type deleted.');
      onDeleted(noteType.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={noteType !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Clinical Note Type?</AlertDialogTitle>
          <AlertDialogDescription>
            {noteType ? (
              <>
                Delete Clinical Note Type &ldquo;
                <strong>{noteType.name}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              'This Clinical Note Type will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteNoteTypeMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteNoteTypeMutation.isPending}
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
