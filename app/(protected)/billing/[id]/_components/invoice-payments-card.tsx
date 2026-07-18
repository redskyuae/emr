'use client';

import type { Invoice } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney, getPaymentMethodLabel } from '../../_utils/invoice-display';

export function InvoicePaymentsCard({
  invoice,
  onRecordPayment,
}: {
  invoice: Invoice;
  onRecordPayment: () => void;
}) {
  const isPayable = invoice.status === 'FINALIZED' || invoice.status === 'PARTIALLY_PAID';

  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payments</CardTitle>
        {isPayable ? (
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
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-muted-foreground border-y text-left">
                  <th className="p-3 pl-4 font-medium">Receipt</th>
                  <th className="p-3 font-medium">Method</th>
                  <th className="p-3 font-medium">Reference</th>
                  <th className="p-3 text-right font-medium">Amount</th>
                  <th className="p-3 pr-4 font-medium">Received</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-b-0">
                    <td className="p-3 pl-4 font-medium">{payment.receiptNumber}</td>
                    <td className="p-3">{getPaymentMethodLabel(payment.method)}</td>
                    <td className="text-muted-foreground p-3">{payment.reference ?? '—'}</td>
                    <td className="p-3 text-right tabular-nums">{formatMoney(payment.amount)}</td>
                    <td className="text-muted-foreground p-3 pr-4">
                      {new Date(payment.receivedAt).toLocaleDateString()}
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
