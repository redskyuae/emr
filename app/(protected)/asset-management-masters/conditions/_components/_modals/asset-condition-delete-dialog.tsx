'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AssetCondition } from '@/app/api/lib/modules/asset-condition/schemas/asset-condition-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteAssetCondition } from '@/app/queries/asset-masters/asset-conditions/useDeleteAssetCondition';
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

type AssetConditionDeleteDialogProps = {
  condition: AssetCondition | null;
  onClose: () => void;
  onDeleted: (conditionId: number) => void;
};

export function AssetConditionDeleteDialog({
  condition,
  onClose,
  onDeleted,
}: AssetConditionDeleteDialogProps) {
  const deleteMutation = useDeleteAssetCondition();

  async function handleConfirmDelete() {
    if (!condition) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(condition.id);
      toast.success('Asset Condition deleted.');
      onDeleted(condition.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={condition !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Asset Condition?</AlertDialogTitle>
          <AlertDialogDescription>
            {condition ? (
              <>
                Delete Asset Condition &ldquo;<strong>{condition.name}</strong>&rdquo;? This action
                cannot be undone.
              </>
            ) : (
              'This Asset Condition will be deleted.'
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
