'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { WorkOrderType } from '@/app/api/lib/modules/work-order-type/schemas/work-order-type-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteWorkOrderType } from '@/app/queries/asset-masters/work-order-types/useDeleteWorkOrderType';
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

type WorkOrderTypeDeleteDialogProps = {
  type: WorkOrderType | null;
  onClose: () => void;
  onDeleted: (typeId: number) => void;
};

export function WorkOrderTypeDeleteDialog({
  type,
  onClose,
  onDeleted,
}: WorkOrderTypeDeleteDialogProps) {
  const deleteMutation = useDeleteWorkOrderType();

  async function handleConfirmDelete() {
    if (!type) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(type.id);
      toast.success('Work Order Type deleted.');
      onDeleted(type.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={type !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Work Order Type?</AlertDialogTitle>
          <AlertDialogDescription>
            {type ? (
              <>
                Delete Work Order Type &ldquo;<strong>{type.name}</strong>&rdquo;? This action
                cannot be undone.
              </>
            ) : (
              'This Work Order Type will be deleted.'
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
