'use client';

import { toast } from 'sonner';

import type { ChargeItem } from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteChargeItem } from '@/app/queries/billing/charge-items/useDeleteChargeItem';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function DeleteChargeItemDialog({
  chargeItem,
  onClose,
}: {
  chargeItem: ChargeItem | null;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteChargeItem();

  async function handleConfirm() {
    if (!chargeItem) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(chargeItem.id);
      toast.success('Charge Item deleted.');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog
      open={chargeItem !== null}
      onOpenChange={(open) => (!open ? onClose() : undefined)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {chargeItem?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Existing Invoice Lines keep their own price and description, so past Invoices are
            unaffected. To retire an item without deleting it, set it inactive instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
