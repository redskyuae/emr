'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import type { Invoice } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteInvoice } from '@/app/queries/billing/invoices/useDeleteInvoice';
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

export function DeleteInvoiceDialog({
  invoice,
  open,
  onClose,
}: {
  invoice: Invoice;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const deleteMutation = useDeleteInvoice();

  async function handleConfirm() {
    try {
      await deleteMutation.mutateAsync(invoice.id);
      toast.success(`Invoice ${invoice.invoiceNumber} deleted.`);
      onClose();
      router.push('/billing');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {invoice.invoiceNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            Only Draft and Void Invoices can be deleted. This removes the Invoice from lists.
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
