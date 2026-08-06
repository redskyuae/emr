'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/app/queries/api-error';
import {
  type GlobalReferenceEntity,
  useDeleteGlobalReference,
} from '@/app/queries/global-references/useGlobalReferencesManagement';
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
import type { GlobalReferenceScreenConfig } from '../global-reference-config';

export function GlobalReferenceDeleteDialog({
  open,
  record,
  config,
  isResolving,
  onClose,
}: {
  open: boolean;
  record: GlobalReferenceEntity | null;
  config: GlobalReferenceScreenConfig;
  isResolving: boolean;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteGlobalReference();
  const isDeleting = deleteMutation.isPending || isResolving;

  async function onConfirm() {
    if (!record) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ resource: config.resource, id: record.id });
      toast.success(`${config.singularTitle} deleted.`);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete {config.singularTitle}?</AlertDialogTitle>
          <AlertDialogDescription>
            {record ? (
              <>
                Delete {config.singularTitle} &ldquo;
                <strong>{record.name}</strong>&rdquo;? This action cannot be undone.
              </>
            ) : (
              `This ${config.singularTitle} will be deleted.`
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting || record === null}
            onClick={(event) => {
              event.preventDefault();
              void onConfirm();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
