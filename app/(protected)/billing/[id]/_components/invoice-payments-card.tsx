'use client';

import { ReceiptText } from 'lucide-react';

import type { Invoice, Payment } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="shadow-fluent-2">
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
                <tr className="text-muted-foreground border-y text-left">
                  <th className="p-3 pl-4 font-medium">Receipt</th>
                  <th className="p-3 font-medium">Method</th>
                  <th className="p-3 font-medium">Reference</th>
                  <th className="p-3 text-right font-medium">Amount</th>
                  <th className="p-3 pr-4 font-medium">Received</th>
                  <th className="p-3 pr-4 text-right font-medium">Receipt action</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-b-0">
                    <td className="p-3 pl-4 font-mono font-medium">{payment.receiptNumber}</td>
                    <td className="p-3">{getPaymentMethodLabel(payment.method)}</td>
                    <td className="text-muted-foreground p-3">{payment.reference ?? '—'}</td>
                    <td className="p-3 text-right tabular-nums">{formatMoney(payment.amount)}</td>
                    <td className="text-muted-foreground p-3 pr-4">
                      {new Date(payment.receivedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewReceipt(payment)}
                        aria-label={`View receipt ${payment.receiptNumber}`}
                      >
                        <ReceiptText className="size-4" />
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
