'use client';

import { CiTrash } from 'react-icons/ci';
import { toast } from 'sonner';
import type { AssetCategory } from '@/app/api/lib/modules/asset-category/schemas/asset-category-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteAssetCategory } from '@/app/queries/asset-masters/useDeleteAssetCategory';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
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
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !deleteMutation.isPending) {
          onClose();
        }
      }}
    >
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <CiTrash />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Asset Category?</AlertDialogTitle>
          <AlertDialogDescription asChild className="w-full">
            <div>
              <SkeletonCrossfade
                isLoading={isResolving}
                skeleton={
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="mx-auto h-4 w-2/3 sm:mx-0" />
                  </div>
                }
              >
                {category ? (
                  <span>
                    Delete Asset Category &ldquo;<strong>{category.name}</strong>&rdquo;? This
                    action cannot be undone.
                  </span>
                ) : (
                  <span>This Asset Category will be deleted.</span>
                )}
              </SkeletonCrossfade>
            </div>
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
