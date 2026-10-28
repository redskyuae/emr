import { useState } from 'react';
import { Plus, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { CHARGE_ITEMS } from '../_data/counter-seed';
import { calculateInvoice, newInvoiceLine } from '../_utils/invoice-calc';
import { formatAed } from '../_utils/money';
import type { BillTo, ChargeItem, InvoiceLine } from '../_utils/counter-types';

const CATEGORIES = ['Consultation', 'Investigation', 'Therapy', 'Pharmacy', 'Wellness'] as const;

function optionLabel(item: ChargeItem) {
  return `${item.code} — ${item.description} — AED ${formatAed(item.unitPrice)}`;
}

export function InvoiceLinesEditor({
  lines,
  hasPayer,
  onChange,
}: {
  lines: InvoiceLine[];
  hasPayer: boolean;
  onChange: (lines: InvoiceLine[]) => void;
}) {
  const [selectedCode, setSelectedCode] = useState('');
  const totals = calculateInvoice(lines);

  function patchLine(key: string, patch: Partial<InvoiceLine>) {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function addLine() {
    const item = CHARGE_ITEMS.find((candidate) => candidate.code === selectedCode);

    if (item) {
      onChange([...lines, newInvoiceLine(item, hasPayer)]);
      setSelectedCode('');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <NativeSelect
          aria-label="Charge Item to add"
          className="w-full"
          value={selectedCode}
          onChange={(event) => setSelectedCode(event.target.value)}
        >
          <option value="">Choose a Charge Item (service or CPT code)…</option>
          {CATEGORIES.map((category) => (
            <optgroup key={category} label={category}>
              {CHARGE_ITEMS.filter((item) => item.category === category).map((item) => (
                <option key={item.code} value={item.code}>
                  {optionLabel(item)}
                </option>
              ))}
            </optgroup>
          ))}
        </NativeSelect>
        <Button type="button" variant="outline" disabled={!selectedCode} onClick={addLine}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {lines.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          No charges yet. Add a Charge Item to start the Invoice.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-muted-foreground bg-muted/40 border-b text-left text-xs">
                <th className="p-2 pl-3 font-medium">Code</th>
                <th className="p-2 font-medium">Description</th>
                <th className="p-2 text-right font-medium">Qty</th>
                <th className="p-2 text-right font-medium">Unit</th>
                <th className="p-2 text-right font-medium">Disc.</th>
                <th className="p-2 text-right font-medium">VAT %</th>
                {hasPayer ? <th className="p-2 font-medium">Bill to</th> : null}
                <th className="p-2 text-right font-medium">Total</th>
                <th className="p-2 pr-3">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.key} className="border-b last:border-b-0">
                  <td className="p-2 pl-3 font-mono text-xs">{line.code}</td>
                  <td className="p-2">
                    {line.description}
                    {CHARGE_ITEMS.find((item) => item.code === line.code)?.cpt ? (
                      <Badge variant="secondary" className="ml-2">
                        CPT
                      </Badge>
                    ) : null}
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      aria-label={`Quantity for ${line.description}`}
                      className="ml-auto h-8 w-16 text-right tabular-nums"
                      value={line.quantity || ''}
                      onChange={(event) =>
                        patchLine(line.key, { quantity: Number(event.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="p-2 text-right tabular-nums">{formatAed(line.unitPrice)}</td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      aria-label={`Discount for ${line.description}`}
                      className="ml-auto h-8 w-20 text-right tabular-nums"
                      value={line.discount || ''}
                      placeholder="0.00"
                      onChange={(event) =>
                        patchLine(line.key, { discount: Number(event.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="p-2 text-right tabular-nums">{line.vatRate}</td>
                  {hasPayer ? (
                    <td className="p-2">
                      <NativeSelect
                        size="sm"
                        aria-label={`Bill ${line.description} to`}
                        value={line.billTo}
                        onChange={(event) =>
                          patchLine(line.key, { billTo: event.target.value as BillTo })
                        }
                      >
                        <option value="PATIENT">Patient</option>
                        <option value="PAYER">Insurer</option>
                      </NativeSelect>
                    </td>
                  ) : null}
                  <td className="p-2 text-right font-medium tabular-nums">
                    {formatAed(totals.lines[index].total)}
                  </td>
                  <td className="p-2 pr-3">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label={`Remove ${line.description}`}
                      onClick={() => onChange(lines.filter((item) => item.key !== line.key))}
                    >
                      <X className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dl className="ml-auto w-full max-w-xs space-y-1 text-sm tabular-nums">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Gross amount</dt>
          <dd>{formatAed(totals.gross)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Discount</dt>
          <dd>− {formatAed(totals.discount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Taxable amount</dt>
          <dd>{formatAed(totals.taxable)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">VAT</dt>
          <dd>{formatAed(totals.vat)}</dd>
        </div>
        <div className="flex justify-between border-t pt-1 font-medium">
          <dt>Invoice total</dt>
          <dd>{formatAed(totals.total)}</dd>
        </div>
        {hasPayer ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Insurer share</dt>
            <dd>{formatAed(totals.payerShare)}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
