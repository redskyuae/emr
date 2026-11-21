'use client';

import { CiReceipt } from 'react-icons/ci';

import type { Invoice, Payment } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  tableCellClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from '@/components/ui/table-styles';
import { cn } from '@/lib/utils';
import { formatMoney, getPaymentMethodLabel } from '../../_utils/invoice-display';

export function InvoicePaymentsCard({
  invoice,
  onRecordPayment,
  onViewReceipt,
  canRecordPayment,
}: {
  invoice: Invoice;
  onRecordPayment: () => void;
  onViewReceipt: (payment: Payment) => void;
  canRecordPayment: boolean;
}) {
  const isPayable = invoice.status === 'FINALIZED' || invoice.status === 'PARTIALLY_PAID';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payments</CardTitle>
        {isPayable && canRecordPayment ? (
          <Button type="button" size="sm" onClick={onRecordPayment}>
            Record payment
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="p-0">
        {invoice.payments.length === 0 ? (
          <p className="text-muted-foreground p-4 text-sm">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className={cn(tableHeadRowClass, 'border-y')}>
                  <th className={tableHeadCellClass}>Receipt</th>
                  <th className={tableHeadCellClass}>Method</th>
                  <th className={tableHeadCellClass}>Reference</th>
                  <th className={cn(tableHeadCellClass, 'text-right')}>Amount</th>
                  <th className={tableHeadCellClass}>Received</th>
                  <th className={cn(tableHeadCellClass, 'text-right')}>Receipt action</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-b-0">
                    <td className={cn(tableCellClass, 'font-mono font-medium')}>
                      {payment.receiptNumber}
                    </td>
                    <td className={tableCellClass}>{getPaymentMethodLabel(payment.method)}</td>
                    <td className={cn(tableCellClass, 'text-muted-foreground')}>
                      {payment.reference ?? '—'}
                    </td>
                    <td className={cn(tableCellClass, 'text-right tabular-nums')}>
                      {formatMoney(payment.amount)}
                    </td>
                    <td className={cn(tableCellClass, 'text-muted-foreground')}>
                      {new Date(payment.receivedAt).toLocaleDateString()}
                    </td>
                    <td className={cn(tableCellClass, 'text-right')}>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewReceipt(payment)}
                        aria-label={`View receipt ${payment.receiptNumber}`}
                      >
                        <CiReceipt className="size-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
