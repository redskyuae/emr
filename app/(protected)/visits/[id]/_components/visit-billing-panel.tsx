import Link from 'next/link';
import { CiReceipt } from 'react-icons/ci';

import type { InvoiceListItem } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

// Mirrors an Invoice row: number over the paid and balance line, then status badge and total.
function InvoiceListSkeleton() {
  return (
    <ul className="space-y-3" aria-label="Loading Invoices">
      {Array.from({ length: 2 }, (_, index) => (
        <li
          key={index}
          className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
        >
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function VisitBillingPanel({ visit, invoices, loading, error, canCreateInvoice }: Props) {
  const createInvoiceUrl = `/billing?invoice=new&patientId=${visit.patient.id}&visitId=${visit.id}`;

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">Billing for this Visit</CardTitle>
        {canCreateInvoice ? (
          <Button asChild size="sm">
            <Link href={createInvoiceUrl}>
              <CiReceipt className="size-4" />
              Create Invoice
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {error && !loading ? (
          <p className="text-destructive text-sm">Invoices could not be loaded.</p>
        ) : (
          <SkeletonCrossfade isLoading={loading} skeleton={<InvoiceListSkeleton />}>
            {invoices.length === 0 ? (
              <Empty className="min-h-56 rounded-lg border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CiReceipt className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No Invoice yet</EmptyTitle>
                  <EmptyDescription>
                    Create an Invoice to record charges and Payments for this Visit.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="space-y-3">
                {invoices.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4 text-sm"
                  >
                    <div className="space-y-1">
                      <Link
                        href={`/billing/${invoice.id}`}
                        className="font-semibold hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                      <p className="text-muted-foreground">
                        Paid {formatMoney(invoice.amountPaid)} · Balance due{' '}
                        {formatMoney(invoice.balanceDue)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={getInvoiceStatusClassName(invoice.status)}
                      >
                        {getInvoiceStatusLabel(invoice.status)}
                      </Badge>
                      <span className="font-semibold tabular-nums">
                        {formatMoney(invoice.grandTotal)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SkeletonCrossfade>
        )}
      </CardContent>
    </Card>
  );
}
