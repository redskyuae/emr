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
import { Skeleton } from '@/components/ui/skeleton';

type AssetCategoryDeleteDialogProps = {
  open: boolean;
  isResolving: boolean;
  category: AssetCategory | null;
  onClose: () => void;
  onDeleted: (categoryId: number) => void;
};

export function AssetCategoryDeleteDialog({
  open,
  isResolving,
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
        <AlertDialog open={open} onOpenChange={(next) => {
        if (!next && !deleteMutation.isPending) {
            onClose();
          }
        }}
      >
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Asset Category?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            {isResolving ? (
              <Skeleton className="h-4 w-3/4" />
            ) : category ? (
              <span>
                Delete Asset Category &ldquo;<strong>{category.name}</strong>&rdquo;? This action
                cannot be undone.
              </span>
            ) : (
              <span>This Asset Category will be deleted.</span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteMutation.isPending || isResolving || category === null}
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
