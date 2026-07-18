'use client';

import { toast } from 'sonner';

import type { Invoice } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useGenerateBedCharges } from '@/app/queries/billing/invoices/useGenerateBedCharges';
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

export function GenerateBedChargesDialog({
  invoice,
  open,
  onClose,
}: {
  invoice: Invoice;
  open: boolean;
  onClose: () => void;
}) {
  const generateMutation = useGenerateBedCharges();

  async function handleConfirm() {
    try {
      const result = await generateMutation.mutateAsync(invoice.id);
      toast.success(`Generated ${result.data.linesAdded} bed-day line(s).`);
      for (const warning of result.data.warnings) {
        toast.warning(warning);
      }
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Generate bed charges for {invoice.invoiceNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            This replaces every existing auto-generated Bed-Day Charge line with a freshly computed
            set from the Admission&apos;s occupancy history. Manually added lines are left
            untouched.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={generateMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={generateMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {generateMutation.isPending ? 'Generating…' : 'Generate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
