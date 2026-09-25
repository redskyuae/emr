'use client';

import { Plus, Trash2 } from 'lucide-react';

import type { Invoice, InvoiceLine } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '../../_utils/invoice-display';

export function InvoiceLinesCard({
  invoice,
  onAddLine,
  onRemoveLine,
  onGenerateBedCharges,
  isRemoving,
  canUpdate,
  canGenerateCharges,
}: {
  invoice: Invoice;
  onAddLine: () => void;
  onRemoveLine: (line: InvoiceLine) => void;
  onGenerateBedCharges: () => void;
  isRemoving: boolean;
  canUpdate: boolean;
  canGenerateCharges: boolean;
}) {
  const isDraft = invoice.status === 'DRAFT';
  const showGenerateCharges = isDraft && canGenerateCharges && Boolean(invoice.admission);
  const showAddLine = isDraft && canUpdate;
  const showRemoveColumn = isDraft && canUpdate;

  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Line items</CardTitle>
        {showGenerateCharges || showAddLine ? (
          <div className="flex gap-2">
            {showGenerateCharges ? (
              <Button type="button" variant="outline" size="sm" onClick={onGenerateBedCharges}>
                Generate bed charges
              </Button>
            ) : null}
            {showAddLine ? (
              <Button type="button" size="sm" onClick={onAddLine}>
                <Plus className="size-4" />
                Add line
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="p-0">
        {invoice.lines.length === 0 ? (
          <p className="text-muted-foreground p-4 text-sm">
            No line items yet. {showAddLine ? 'Add a Charge Item to get started.' : null}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-muted-foreground border-y text-left">
                  <th className="p-3 pl-4 font-medium">Description</th>
                  <th className="p-3 text-right font-medium">Qty</th>
                  <th className="p-3 text-right font-medium">Unit Price</th>
                  <th className="p-3 text-right font-medium">Amount</th>
                  {showRemoveColumn ? <th className="p-3 pr-4" /> : null}
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line) => (
                  <tr key={line.id} className="border-b last:border-b-0">
                    <td className="p-3 pl-4">
                      {line.description}
                      {line.source === 'BED_AUTO' ? (
                        <Badge variant="secondary" className="ml-2">
                          Auto
                        </Badge>
                      ) : null}
                    </td>
                    <td className="p-3 text-right tabular-nums">{line.quantity}</td>
                    <td className="p-3 text-right tabular-nums">{formatMoney(line.unitPrice)}</td>
                    <td className="p-3 text-right tabular-nums">{formatMoney(line.amount)}</td>
                    {showRemoveColumn ? (
                      <td className="p-3 pr-4 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${line.description}`}
                          disabled={isRemoving}
                          onClick={() => onRemoveLine(line)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    ) : null}
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
