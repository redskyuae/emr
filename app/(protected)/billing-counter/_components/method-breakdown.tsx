import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { computeMethodBreakdown } from '../_utils/counter-ledger';
import type { LedgerTxn } from '../_utils/counter-types';
import { TENDER_META } from '../_utils/tender';
import { Money } from './txn-cells';

const SETTLES_TO = {
  DRAWER: 'Cash drawer',
  CARD: 'Card terminal batch',
  BANK: 'Bank',
  OTHER: 'Other',
  ADVANCE: 'Advance account',
} as const;

export function MethodBreakdown({ txns }: { txns: LedgerTxn[] }) {
  const rows = computeMethodBreakdown(txns).filter(
    ({ method, received, refunded }) =>
      method === 'CASH' || method === 'CARD' || received !== 0 || refunded !== 0
  );

  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle className="text-base">Collections by payment method</CardTitle>
        <CardDescription>
          Cash is counted in the drawer, cards against the terminal batch, and the rest against the
          bank statement.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-muted-foreground bg-muted/60 border-y text-left text-xs tracking-wider uppercase">
              <th className="p-2 pl-4 font-semibold">Method</th>
              <th className="p-2 font-semibold">Reconciled against</th>
              <th className="p-2 text-right font-semibold">Received</th>
              <th className="p-2 text-right font-semibold">Refunded</th>
              <th className="p-2 pr-4 text-right font-semibold">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ method, received, refunded, net }) => (
              <tr key={method} className="border-b last:border-b-0">
                <td className="p-2 pl-4">{TENDER_META[method].label}</td>
                <td className="text-muted-foreground p-2">
                  {SETTLES_TO[TENDER_META[method].group]}
                </td>
                <td className="p-2 text-right">
                  <Money value={received} />
                </td>
                <td className="p-2 text-right">
                  <Money value={refunded} />
                </td>
                <td className="p-2 pr-4 text-right font-medium">
                  <Money value={net} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
