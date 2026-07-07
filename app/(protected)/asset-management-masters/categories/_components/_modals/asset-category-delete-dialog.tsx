'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AssetCategory } from '@/app/api/lib/modules/asset-category/schemas/asset-category-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteAssetCategory } from '@/app/queries/asset-masters/useDeleteAssetCategory';
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

type AssetCategoryDeleteDialogProps = {
  category: AssetCategory | null;
  onClose: () => void;
  onDeleted: (categoryId: number) => void;
};

export function AssetCategoryDeleteDialog({
  category,
  onClose,
  onDeleted,
}: AssetCategoryDeleteDialogProps) {
  const deleteMutation = useDeleteAssetCategory();

  async function handleConfirmDelete() {
    if (!category) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(category.id);
      toast.success('Asset Category deleted.');
      onDeleted(category.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={category !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Asset Category?</AlertDialogTitle>
          <AlertDialogDescription>
            {category ? (
              <>
                Delete Asset Category &ldquo;<strong>{category.name}</strong>&rdquo;? This action
                cannot be undone.
              </>
            ) : (
              'This Asset Category will be deleted.'
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
