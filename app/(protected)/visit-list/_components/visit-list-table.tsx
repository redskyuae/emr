import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { ReceiptText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMoney } from '../../billing/_utils/invoice-display';
import { visitStatusPresentation } from '../../visits/_utils/visit-status';
import type { VisitListRow } from '../_data/static-visit-list';
import { BILLING_PRESENTATION } from '../_utils/visit-list-presentation';

export function VisitListTable({ rows, today }: { rows: VisitListRow[]; today: Date }) {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-sm">
          <thead>
            <tr className="text-muted-foreground bg-muted/60 border-b text-left text-xs tracking-wider uppercase">
              <th className="p-3 pl-5 font-semibold">Token</th>
              <th className="p-3 font-semibold">Visit</th>
              <th className="p-3 font-semibold">Patient</th>
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Doctor</th>
              <th className="p-3 font-semibold">Type</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Billing</th>
              <th className="p-3 pr-5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = visitStatusPresentation(row.status);
              const billing = BILLING_PRESENTATION[row.billing.status];
              const canBill = row.status !== 'CANCELLED';

              return (
                <tr key={row.id} className="hover:bg-muted/50 border-b last:border-b-0">
                  <td className="px-3 py-3.5 pl-5">
                    <span className="bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-md text-base font-semibold tabular-nums">
                      {row.queueToken}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <p className="font-mono font-medium">{row.visitNumber}</p>
                    <p className="text-muted-foreground text-xs">
                      {row.bookingNumber ?? 'Walk-in'}
                    </p>
                  </td>
                  <td className="px-3 py-3.5">
                    <p className="font-medium">{row.patient.name}</p>
                    <p className="text-muted-foreground text-xs">
                      <span className="font-mono">{row.patient.mrn}</span> · {row.patient.age}
                      {row.patient.sex}
                      {row.patientType === 'New' ? ' · New' : ''}
                    </p>
                  </td>
                  <td className="px-3 py-3.5 tabular-nums">
                    <p>{format(subDays(today, row.dayOffset), 'dd MMM yyyy')}</p>
                    <p className="text-muted-foreground text-xs">{row.checkedInAt}</p>
                  </td>
                  <td className="px-3 py-3.5">{row.doctor.name}</td>
                  <td className="px-3 py-3.5">
                    <Badge variant="secondary">{row.visitType.code}</Badge>
                    {row.treatment ? (
                      <p className="text-muted-foreground mt-1 max-w-48 truncate text-xs">
                        {row.treatment}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3.5">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-3 py-3.5">
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
                  <td className="px-3 py-3.5 pr-5 text-right">
                    {canBill ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/billing-counter?visit=${row.visitNumber}`}>
                          <ReceiptText className="size-4" />
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
