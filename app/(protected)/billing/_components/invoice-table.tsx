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

// Mirrors the loaded list: the same header, one sized skeleton per cell for a full page
// (ten rows), and the "Showing … of …" pager row that sits under the table.
export function InvoiceTableSkeleton() {
  return (
    <div className="space-y-4">
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
              {Array.from({ length: 10 }, (_, row) => (
                <tr key={row} className="border-b last:border-b-0">
                  <td className={tableCellClass}>
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className={tableCellClass}>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="ml-auto h-4 w-20" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="ml-auto h-4 w-20" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-4 w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <Skeleton className="h-4 w-36" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
