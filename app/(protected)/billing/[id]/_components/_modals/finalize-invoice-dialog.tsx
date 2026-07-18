'use client';

import { toast } from 'sonner';

import type { Invoice } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useFinalizeInvoice } from '@/app/queries/billing/invoices/useFinalizeInvoice';
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

export function FinalizeInvoiceDialog({
  invoice,
  open,
  onClose,
}: {
  invoice: Invoice;
  open: boolean;
  onClose: () => void;
}) {
  const finalizeMutation = useFinalizeInvoice();

  async function handleConfirm() {
    try {
      await finalizeMutation.mutateAsync(invoice.id);
      toast.success(`Invoice ${invoice.invoiceNumber} finalized.`);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Finalize {invoice.invoiceNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            Once finalized, line items and the discount are locked. You can then record payments. A
            zero-total Invoice is marked Paid immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={finalizeMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={finalizeMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {finalizeMutation.isPending ? 'Finalizing…' : 'Finalize'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
