'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { WorkOrderPriority } from '@/app/api/lib/modules/work-order-priority/schemas/work-order-priority-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteWorkOrderPriority } from '@/app/queries/asset-masters/work-order-priorities/useDeleteWorkOrderPriority';
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

type WorkOrderPriorityDeleteDialogProps = {
  priority: WorkOrderPriority | null;
  onClose: () => void;
  onDeleted: (priorityId: number) => void;
};

export function WorkOrderPriorityDeleteDialog({
  priority,
  onClose,
  onDeleted,
}: WorkOrderPriorityDeleteDialogProps) {
  const deleteMutation = useDeleteWorkOrderPriority();

  async function handleConfirmDelete() {
    if (!priority) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(priority.id);
      toast.success('Work Order Priority deleted.');
      onDeleted(priority.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={priority !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Work Order Priority?</AlertDialogTitle>
          <AlertDialogDescription>
            {priority ? (
              <>
                Delete Work Order Priority &ldquo;<strong>{priority.name}</strong>&rdquo;? This
                action cannot be undone.
              </>
            ) : (
              'This Work Order Priority will be deleted.'
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
