'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { TherapistSkill } from '@/app/api/lib/modules/therapist-skill/schemas/therapist-skill-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteTherapistSkill } from '@/app/queries/therapist-skills/useDeleteTherapistSkill';
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

type DeleteTherapistSkillDialogProps = {
  skill: TherapistSkill | null;
  onClose: () => void;
  onDeleted: (skillId: number) => void;
};

export function DeleteTherapistSkillDialog({
  skill,
  onClose,
  onDeleted,
}: DeleteTherapistSkillDialogProps) {
  const deleteMutation = useDeleteTherapistSkill();

  async function handleConfirmDelete() {
    if (!skill) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(skill.id);
      toast.success('Therapist Skill deleted.');
      onDeleted(skill.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={skill !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Therapist Skill?</AlertDialogTitle>
          <AlertDialogDescription>
            {skill ? (
              <>
                Delete Therapist Skill &ldquo;
                <strong>{skill.name}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              'This Therapist Skill will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteMutation.isPending}
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
