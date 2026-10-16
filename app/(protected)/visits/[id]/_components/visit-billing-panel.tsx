import Link from 'next/link';
import { ReceiptText } from 'lucide-react';

import type { InvoiceListItem } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

import {
  formatMoney,
  getInvoiceStatusClassName,
  getInvoiceStatusLabel,
} from '../../../billing/_utils/invoice-display';

type Props = {
  visit: Visit;
  invoices: InvoiceListItem[];
  loading: boolean;
  error: boolean;
  canCreateInvoice: boolean;
};

export function VisitBillingPanel({ visit, invoices, loading, error, canCreateInvoice }: Props) {
  const createInvoiceUrl = `/billing?invoice=new&patientId=${visit.patient.id}&visitId=${visit.id}`;

  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">Billing for this Visit</CardTitle>
        {canCreateInvoice ? (
          <Button asChild size="sm">
            <Link href={createInvoiceUrl}>
              <ReceiptText className="size-4" />
              Create Invoice
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-muted-foreground text-sm">Loading Invoices…</p> : null}
        {error ? <p className="text-destructive text-sm">Invoices could not be loaded.</p> : null}
        {!loading && !error && invoices.length === 0 ? (
          <Empty className="min-h-56 rounded-lg border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptText className="size-5" />
              </EmptyMedia>
              <EmptyTitle>No Invoice yet</EmptyTitle>
              <EmptyDescription>
                Create an Invoice to record charges and Payments for this Visit.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
        {invoices.length > 0 ? (
          <ul className="space-y-3">
            {invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4 text-sm"
              >
                <div className="space-y-1">
                  <Link href={`/billing/${invoice.id}`} className="font-semibold hover:underline">
                    {invoice.invoiceNumber}
                  </Link>
                  <p className="text-muted-foreground">
                    Paid {formatMoney(invoice.amountPaid)} · Balance due{' '}
                    {formatMoney(invoice.balanceDue)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={getInvoiceStatusClassName(invoice.status)}>
                    {getInvoiceStatusLabel(invoice.status)}
                  </Badge>
                  <span className="font-semibold tabular-nums">
                    {formatMoney(invoice.grandTotal)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
