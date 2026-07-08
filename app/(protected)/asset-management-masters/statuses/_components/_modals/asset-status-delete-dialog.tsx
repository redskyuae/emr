'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AssetStatus } from '@/app/api/lib/modules/asset-status/schemas/asset-status-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteAssetStatus } from '@/app/queries/asset-masters/asset-statuses/useDeleteAssetStatus';
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

type AssetStatusDeleteDialogProps = {
  status: AssetStatus | null;
  onClose: () => void;
  onDeleted: (statusId: number) => void;
};

export function AssetStatusDeleteDialog({
  status,
  onClose,
  onDeleted,
}: AssetStatusDeleteDialogProps) {
  const deleteMutation = useDeleteAssetStatus();

  async function handleConfirmDelete() {
    if (!status) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(status.id);
      toast.success('Asset Status deleted.');
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
          <AlertDialogTitle>Delete Asset Status?</AlertDialogTitle>
          <AlertDialogDescription>
            {status ? (
              <>
                Delete Asset Status &ldquo;<strong>{status.name}</strong>&rdquo;? This action cannot
                be undone.
              </>
            ) : (
              'This Asset Status will be deleted.'
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
