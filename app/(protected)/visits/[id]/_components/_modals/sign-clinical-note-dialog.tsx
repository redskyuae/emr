'use client';

import { toast } from 'sonner';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useSignClinicalNote } from '@/app/queries/patients/chart/useSignClinicalNote';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export function SignClinicalNoteDialog({
  patientId,
  note,
  onClose,
}: {
  patientId: number;
  note: ClinicalNote | null;
  onClose: () => void;
}) {
  const signNote = useSignClinicalNote();

  async function handleConfirm() {
    if (!note) return;

    try {
      await signNote.mutateAsync({ patientId, noteId: note.id });
      toast.success('Clinical Note signed.');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={note !== null} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign this Clinical Note?</AlertDialogTitle>
          <AlertDialogDescription>
            A signed Clinical Note can no longer be edited or deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={signNote.isPending}>Keep as draft</AlertDialogCancel>
          <Button
            type="button"
            disabled={signNote.isPending}
            aria-busy={signNote.isPending}
            onClick={() => void handleConfirm()}
          >
            {signNote.isPending ? 'Signing…' : 'Sign note'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
