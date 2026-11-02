'use client';

import { useEffect } from 'react';
import { CheckCircle2, Printer } from 'lucide-react';

import type { Invoice, Payment } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { LogoMark } from '@/components/brand/logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatMoney, getPaymentMethodLabel } from '../../../_utils/invoice-display';

function formatReceivedAt(receivedAt: Date, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(receivedAt));
}

export function PaymentReceiptDialog({
  invoice,
  payment,
  tenantName,
  timeZone,
  open,
  onClose,
}: {
  open: boolean;
  invoice: Invoice;
  payment: Payment;
  onClose: () => void;
  tenantName: string;
  timeZone: string;
}) {
  useEffect(
    () => () => {
      document.body.classList.remove('payment-receipt-printing');
    },
    []
  );

  function handlePrint() {
    const finishPrinting = () => {
      document.body.classList.remove('payment-receipt-printing');
    };

    document.body.classList.add('payment-receipt-printing');
    window.addEventListener('afterprint', finishPrinting, { once: true });

    try {
      window.print();
    } catch (error) {
      finishPrinting();
      throw error;
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-xl">
        <section
          data-payment-receipt
          className="bg-card text-card-foreground space-y-6 rounded-lg border p-6"
        >
          <DialogHeader className="gap-2 text-left">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <LogoMark className="size-10" />
                <div className="min-w-0">
                  <p className="font-heading text-xl leading-tight font-semibold">{tenantName}</p>
                  <p className="text-muted-foreground text-sm">Medical EMR</p>
                </div>
              </div>
              <Badge variant="outline" className="border-success/40 text-success gap-1">
                <CheckCircle2 className="size-3.5" />
                Payment recorded
              </Badge>
            </div>
            <DialogTitle className="pt-2">Payment receipt</DialogTitle>
            <DialogDescription>
              Receipt for the Payment received against Invoice {invoice.invoiceNumber}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Receipt Number
              </p>
              <p className="font-mono text-lg font-semibold">{payment.receiptNumber}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Amount received
              </p>
              <p className="text-2xl font-semibold tabular-nums">{formatMoney(payment.amount)}</p>
            </div>
          </div>

          <Separator />

          <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Received from</dt>
              <dd className="font-medium">
                {invoice.patient.firstName} {invoice.patient.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Patient MRN</dt>
              <dd className="font-mono font-medium">{invoice.patient.mrn}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Invoice Number</dt>
              <dd className="font-mono font-medium">{invoice.invoiceNumber}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payment method</dt>
              <dd className="font-medium">{getPaymentMethodLabel(payment.method)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payment date</dt>
              <dd className="font-medium">{formatReceivedAt(payment.receivedAt, timeZone)}</dd>
            </div>
            {payment.reference ? (
              <div>
                <dt className="text-muted-foreground">Transaction reference</dt>
                <dd className="font-mono font-medium break-all">{payment.reference}</dd>
              </div>
            ) : null}
            {payment.notes ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Payment notes</dt>
                <dd className="font-medium">{payment.notes}</dd>
              </div>
            ) : null}
          </dl>

          <div className="border-t pt-4 text-center text-sm">
            <p className="font-medium">Thank you for choosing {tenantName}.</p>
            <p className="text-muted-foreground mt-1 text-xs">
              This is a computer-generated receipt and does not require a signature.
            </p>
          </div>
        </section>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={handlePrint}>
            <Printer className="size-4" />
            Print receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
