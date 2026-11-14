'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import type { Invoice } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getInvoiceStatusClassName, getInvoiceStatusLabel } from '../../_utils/invoice-display';

export function InvoiceHeader({
  invoice,
  actions,
}: {
  invoice: Invoice;
  actions: React.ReactNode;
}) {
  return (
    <div className="bg-card shadow-fluent-2 flex flex-col gap-4 rounded-xl border p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Back to Invoices">
            <Link href="/billing">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h2 className="text-xl font-semibold">{invoice.invoiceNumber}</h2>
          <Badge variant="outline" className={getInvoiceStatusClassName(invoice.status)}>
            {getInvoiceStatusLabel(invoice.status)}
          </Badge>
        </div>
        <p className="text-muted-foreground pl-11 text-sm">
          Invoice for {invoice.patient.firstName} {invoice.patient.lastName}
        </p>
        {invoice.status === 'VOID' && invoice.voidReason ? (
          <p className="text-destructive pl-11 text-xs">Voided: {invoice.voidReason}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-11 lg:pl-0">{actions}</div>
    </div>
  );
}
