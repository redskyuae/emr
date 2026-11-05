import type { ReactNode } from 'react';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';
import { CHARGE_ITEMS } from '../_data/counter-seed';
import { calculateInvoice, newInvoiceLine } from '../_utils/invoice-calc';
import { formatAed } from '../_utils/money';
import type { BillTo, InvoiceLine } from '../_utils/counter-types';
import { ChargeItemPicker } from './charge-item-picker';

function LineField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor} className="text-muted-foreground text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ReadOnlyValue({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return (
    <p className={cn('flex h-8 items-center text-sm tabular-nums', strong && 'font-semibold')}>
      {children}
    </p>
  );
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
  const totals = calculateInvoice(lines);

  function patchLine(key: string, patch: Partial<InvoiceLine>) {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  return (
    <div className="@container space-y-3">
      <ChargeItemPicker onPick={(item) => onChange([...lines, newInvoiceLine(item, hasPayer)])} />

      {lines.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          No charges yet. Search above to add a Charge Item to the Invoice.
        </p>
      ) : (
        <ul className="space-y-2">
          {lines.map((line, index) => {
            const calculated = totals.lines[index];

            return (
              <li key={line.key} className="space-y-3 rounded-md border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {line.description}
                      {CHARGE_ITEMS.find((item) => item.code === line.code)?.cpt ? (
                        <Badge variant="secondary" className="ml-2">
                          CPT
                        </Badge>
                      ) : null}
                    </p>
                    <p className="text-muted-foreground font-mono text-xs">{line.code}</p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0"
                    aria-label={`Remove ${line.description}`}
                    onClick={() => onChange(lines.filter((item) => item.key !== line.key))}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 @md:grid-cols-3 @2xl:grid-cols-6">
                  <LineField label="Qty" htmlFor={`${line.key}-qty`}>
                    <Input
                      id={`${line.key}-qty`}
                      type="number"
                      min={1}
                      step={1}
                      aria-label={`Quantity for ${line.description}`}
                      className="h-8 text-right tabular-nums"
                      value={line.quantity || ''}
                      onChange={(event) =>
                        patchLine(line.key, { quantity: Number(event.target.value) || 0 })
                      }
                    />
                  </LineField>
                  <LineField label="Unit price">
                    <ReadOnlyValue>{formatAed(line.unitPrice)}</ReadOnlyValue>
                  </LineField>
                  <LineField label="Discount %" htmlFor={`${line.key}-disc`}>
                    <Input
                      id={`${line.key}-disc`}
                      type="number"
                      min={0}
                      max={100}
                      step="0.5"
                      inputMode="decimal"
                      placeholder="0"
                      aria-label={`Discount percent for ${line.description}`}
                      className="h-8 text-right tabular-nums"
                      value={line.discountPercent || ''}
                      onChange={(event) =>
                        patchLine(line.key, {
                          discountPercent: Number(event.target.value) || 0,
                        })
                      }
                    />
                    {calculated.discount > 0 ? (
                      <p className="text-muted-foreground text-right text-xs tabular-nums">
                        − {formatAed(calculated.discount)}
                      </p>
                    ) : null}
                  </LineField>
                  <LineField label="VAT %">
                    <ReadOnlyValue>{line.vatRate}</ReadOnlyValue>
                  </LineField>
                  {hasPayer ? (
                    <LineField label="Bill to" htmlFor={`${line.key}-bill`}>
                      <NativeSelect
                        id={`${line.key}-bill`}
                        size="sm"
                        className="w-full"
                        aria-label={`Bill ${line.description} to`}
                        value={line.billTo}
                        onChange={(event) =>
                          patchLine(line.key, { billTo: event.target.value as BillTo })
                        }
                      >
                        <option value="PATIENT">Patient</option>
                        <option value="PAYER">Insurer</option>
                      </NativeSelect>
                    </LineField>
                  ) : null}
                  <LineField label="Line total">
                    <ReadOnlyValue strong>{formatAed(calculated.total)}</ReadOnlyValue>
                  </LineField>
                </div>
              </li>
            );
          })}
        </ul>
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

      <div className="bg-success/10 border-success/30 flex items-center justify-between rounded-md border px-3 py-2">
        <span className="text-success text-sm font-medium">Patient pays</span>
        <span className="text-success font-heading text-lg font-semibold tabular-nums">
          AED {formatAed(totals.patientShare)}
        </span>
      </div>
    </div>
  );
}
