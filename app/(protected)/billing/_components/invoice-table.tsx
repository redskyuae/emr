'use client';

import Link from 'next/link';

import type { InvoiceListItem } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatMoney,
  getInvoiceStatusClassName,
  getInvoiceStatusLabel,
} from '../_utils/invoice-display';

function encounterChip(invoice: InvoiceListItem) {
  if (invoice.visit) {
    return <Badge variant="secondary">Visit {invoice.visit.visitNumber}</Badge>;
  }

  if (invoice.admission) {
    return <Badge variant="secondary">Adm {invoice.admission.admissionNumber}</Badge>;
  }

  return <span className="text-muted-foreground">—</span>;
}

export function InvoiceTable({ invoices }: { invoices: InvoiceListItem[] }) {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="text-muted-foreground bg-muted/60 border-b text-left text-xs tracking-wider uppercase">
              <th className="p-3 pl-5 font-semibold">Invoice</th>
              <th className="p-3 font-semibold">Patient</th>
              <th className="p-3 font-semibold">Encounter</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 text-right font-semibold">Grand Total</th>
              <th className="p-3 text-right font-semibold">Balance Due</th>
              <th className="p-3 pr-5 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-muted/50 border-b last:border-b-0">
                <td className="px-3 py-3.5 pl-5 font-medium">
                  <Link href={`/billing/${invoice.id}`} className="hover:underline">
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                <td className="px-3 py-3.5">
                  {invoice.patient.firstName} {invoice.patient.lastName}
                  <span className="text-muted-foreground block text-xs">{invoice.patient.mrn}</span>
                </td>
                <td className="px-3 py-3.5">{encounterChip(invoice)}</td>
                <td className="px-3 py-3.5">
                  <Badge variant="outline" className={getInvoiceStatusClassName(invoice.status)}>
                    {getInvoiceStatusLabel(invoice.status)}
                  </Badge>
                </td>
                <td className="px-3 py-3.5 text-right tabular-nums">
                  {formatMoney(invoice.grandTotal)}
                </td>
                <td className="px-3 py-3.5 text-right tabular-nums">
                  {formatMoney(invoice.balanceDue)}
                </td>
                <td className="text-muted-foreground px-3 py-3.5 pr-5">
                  {new Date(invoice.createdOn).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function InvoiceTableSkeleton() {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-xl border p-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b p-2 last:border-b-0">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="ml-auto h-5 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}
