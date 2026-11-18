'use client';

import Link from 'next/link';

import type { InvoiceListItem } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  tableCellClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from '@/components/ui/table-styles';
import { cn } from '@/lib/utils';
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
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeadCellClass}>Invoice</th>
              <th className={tableHeadCellClass}>Patient</th>
              <th className={tableHeadCellClass}>Encounter</th>
              <th className={tableHeadCellClass}>Status</th>
              <th className={cn(tableHeadCellClass, 'text-right')}>Grand Total</th>
              <th className={cn(tableHeadCellClass, 'text-right')}>Balance Due</th>
              <th className={tableHeadCellClass}>Created</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-muted/50 border-b last:border-b-0">
                <td className={cn(tableCellClass, 'font-medium')}>
                  <Link href={`/billing/${invoice.id}`} className="hover:underline">
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                <td className={tableCellClass}>
                  {invoice.patient.firstName} {invoice.patient.lastName}
                  <span className="text-muted-foreground block text-xs">{invoice.patient.mrn}</span>
                </td>
                <td className={tableCellClass}>{encounterChip(invoice)}</td>
                <td className={tableCellClass}>
                  <Badge variant="outline" className={getInvoiceStatusClassName(invoice.status)}>
                    {getInvoiceStatusLabel(invoice.status)}
                  </Badge>
                </td>
                <td className={cn(tableCellClass, 'text-right tabular-nums')}>
                  {formatMoney(invoice.grandTotal)}
                </td>
                <td className={cn(tableCellClass, 'text-right tabular-nums')}>
                  {formatMoney(invoice.balanceDue)}
                </td>
                <td className={cn(tableCellClass, 'text-muted-foreground')}>
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
    <div className="bg-card overflow-hidden rounded-xl border p-4">
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
