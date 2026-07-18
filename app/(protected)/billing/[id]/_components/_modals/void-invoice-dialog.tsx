'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import type { Invoice } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useVoidInvoice } from '@/app/queries/billing/invoices/useVoidInvoice';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

export function VoidInvoiceDialog({
  invoice,
  open,
  onClose,
}: {
  invoice: Invoice;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent>
        {/* Keyed on the Invoice so the reason starts empty each open, without an
            effect resetting state after render. */}
        {open ? <VoidInvoiceForm key={invoice.id} invoice={invoice} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function VoidInvoiceForm({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const voidMutation = useVoidInvoice();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (reason.trim() === '') {
      setError('A reason is required to void an Invoice.');
      return;
    }

    try {
      await voidMutation.mutateAsync({ id: invoice.id, request: { voidReason: reason.trim() } });
      toast.success(`Invoice ${invoice.invoiceNumber} voided.`);
      onClose();
    } catch (mutationError) {
      toast.error(getApiErrorMessage(mutationError));
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Void {invoice.invoiceNumber}?</DialogTitle>
        <DialogDescription>
          Voiding annuls this Invoice. It is only possible while no payments have been recorded.
        </DialogDescription>
      </DialogHeader>

      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor="void-reason">
          Reason{' '}
          <span aria-hidden className="text-destructive">
            *
          </span>
        </FieldLabel>
        <Textarea
          id="void-reason"
          rows={3}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setError(null);
          }}
          placeholder="Duplicate bill, raised in error, …"
        />
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={voidMutation.isPending}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={voidMutation.isPending}
          onClick={() => void handleConfirm()}
        >
          {voidMutation.isPending ? 'Voiding…' : 'Void invoice'}
        </Button>
      </DialogFooter>
    </>
  );
}
