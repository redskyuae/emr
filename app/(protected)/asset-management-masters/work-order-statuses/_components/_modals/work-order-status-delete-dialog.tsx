'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { WorkOrderStatus } from '@/app/api/lib/modules/work-order-status/schemas/work-order-status-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteWorkOrderStatus } from '@/app/queries/asset-masters/work-order-statuses/useDeleteWorkOrderStatus';
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

type WorkOrderStatusDeleteDialogProps = {
  status: WorkOrderStatus | null;
  onClose: () => void;
  onDeleted: (statusId: number) => void;
};

export function WorkOrderStatusDeleteDialog({
  status,
  onClose,
  onDeleted,
}: WorkOrderStatusDeleteDialogProps) {
  const deleteMutation = useDeleteWorkOrderStatus();

  async function handleConfirmDelete() {
    if (!status) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(status.id);
      toast.success('Work Order Status deleted.');
      onDeleted(status.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={status !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Work Order Status?</AlertDialogTitle>
          <AlertDialogDescription>
            {status ? (
              <>
                Delete Work Order Status &ldquo;<strong>{status.name}</strong>&rdquo;? This action
                cannot be undone.
              </>
            ) : (
              'This Work Order Status will be deleted.'
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
