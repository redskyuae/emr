'use client';

import { CiTrash } from 'react-icons/ci';
import { PiListPlusDuotone, PiPlusLight } from 'react-icons/pi';

import type { Invoice, InvoiceLine } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { EmptyState } from '@/components/app/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  tableCellClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from '@/components/ui/table-styles';
import { cn } from '@/lib/utils';
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Charges</CardTitle>
        {showGenerateCharges || showAddLine ? (
          <div className="flex gap-2">
            {showGenerateCharges ? (
              <Button type="button" variant="outline" size="sm" onClick={onGenerateBedCharges}>
                Generate bed charges
              </Button>
            ) : null}
            {showAddLine ? (
              <Button type="button" size="sm" onClick={onAddLine}>
                <PiPlusLight className="size-4" />
                Add line
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="p-0">
        {invoice.lines.length === 0 ? (
          <EmptyState
            size="sm"
            tone="green"
            title="No line items yet"
            icon={PiListPlusDuotone}
            description={showAddLine ? 'Add a Charge Item to get started.' : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className={cn(tableHeadRowClass, 'border-y')}>
                  <th className={tableHeadCellClass}>Description</th>
                  <th className={cn(tableHeadCellClass, 'text-right')}>Qty</th>
                  <th className={cn(tableHeadCellClass, 'text-right')}>Unit Price</th>
                  <th className={cn(tableHeadCellClass, 'text-right')}>Amount</th>
                  {showRemoveColumn ? <th className={tableHeadCellClass} /> : null}
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line) => (
                  <tr key={line.id} className="border-b last:border-b-0">
                    <td className={tableCellClass}>
                      {line.description}
                      {line.source === 'BED_AUTO' ? (
                        <Badge variant="secondary" className="ml-2">
                          Auto
                        </Badge>
                      ) : null}
                    </td>
                    <td className={cn(tableCellClass, 'text-right tabular-nums')}>
                      {line.quantity}
                    </td>
                    <td className={cn(tableCellClass, 'text-right tabular-nums')}>
                      {formatMoney(line.unitPrice)}
                    </td>
                    <td className={cn(tableCellClass, 'text-right tabular-nums')}>
                      {formatMoney(line.amount)}
                    </td>
                    {showRemoveColumn ? (
                      <td className={cn(tableCellClass, 'text-right')}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${line.description}`}
                          disabled={isRemoving}
                          onClick={() => onRemoveLine(line)}
                        >
                          <CiTrash className="size-4" />
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
