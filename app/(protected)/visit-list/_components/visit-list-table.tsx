import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { CiReceipt } from 'react-icons/ci';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  tableCellClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from '@/components/ui/table-styles';
import { cn } from '@/lib/utils';
import { formatMoney } from '../../billing/_utils/invoice-display';
import { visitStatusPresentation } from '../../visits/_utils/visit-status';
import type { VisitListRow } from '../_data/static-visit-list';
import { BILLING_PRESENTATION } from '../_utils/visit-list-presentation';

export function VisitListTable({ rows, today }: { rows: VisitListRow[]; today: Date }) {
  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeadCellClass}>Token</th>
              <th className={tableHeadCellClass}>Visit</th>
              <th className={tableHeadCellClass}>Patient</th>
              <th className={tableHeadCellClass}>Date</th>
              <th className={tableHeadCellClass}>Doctor</th>
              <th className={tableHeadCellClass}>Type</th>
              <th className={tableHeadCellClass}>Status</th>
              <th className={tableHeadCellClass}>Billing</th>
              <th className={cn(tableHeadCellClass, 'text-right')}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = visitStatusPresentation(row.status);
              const billing = BILLING_PRESENTATION[row.billing.status];
              const canBill = row.status !== 'CANCELLED';

              return (
                <tr key={row.id} className="hover:bg-muted/50 border-b last:border-b-0">
                  <td className={tableCellClass}>
                    <span className="bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-md text-base font-semibold tabular-nums">
                      {row.queueToken}
                    </span>
                  </td>
                  <td className={tableCellClass}>
                    <p className="font-mono font-medium">{row.visitNumber}</p>
                    <p className="text-muted-foreground text-xs">
                      {row.bookingNumber ?? 'Walk-in'}
                    </p>
                  </td>
                  <td className={tableCellClass}>
                    <p className="font-medium">{row.patient.name}</p>
                    <p className="text-muted-foreground text-xs">
                      <span className="font-mono">{row.patient.mrn}</span> · {row.patient.age}
                      {row.patient.sex}
                      {row.patientType === 'New' ? ' · New' : ''}
                    </p>
                  </td>
                  <td className={cn(tableCellClass, 'tabular-nums')}>
                    <p>{format(subDays(today, row.dayOffset), 'dd MMM yyyy')}</p>
                    <p className="text-muted-foreground text-xs">{row.checkedInAt}</p>
                  </td>
                  <td className={tableCellClass}>{row.doctor.name}</td>
                  <td className={tableCellClass}>
                    <Badge variant="secondary">{row.visitType.code}</Badge>
                    {row.treatment ? (
                      <p className="text-muted-foreground mt-1 max-w-48 truncate text-xs">
                        {row.treatment}
                      </p>
                    ) : null}
                  </td>
                  <td className={tableCellClass}>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className={tableCellClass}>
                    <Badge variant="outline" className={billing.className}>
                      {billing.label}
                    </Badge>
                    {row.billing.invoiceNumber ? (
                      <p className="text-muted-foreground mt-1 font-mono text-xs">
                        {row.billing.invoiceNumber}
                      </p>
                    ) : null}
                    {row.billing.balanceDue > 0 ? (
                      <p className="text-warning text-xs font-medium tabular-nums">
                        Due AED {formatMoney(row.billing.balanceDue)}
                      </p>
                    ) : null}
                  </td>
                  <td className={cn(tableCellClass, 'text-right')}>
                    {canBill ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/billing-counter?visit=${row.visitNumber}`}>
                          <CiReceipt className="size-4" />
                          {row.billing.status === 'NOT_BILLED' ? 'Bill' : 'Billing'}
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">No charges</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
