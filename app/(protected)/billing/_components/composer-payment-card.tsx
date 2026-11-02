'use client';

import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { PAYMENT_METHOD_OPTIONS, formatMoney } from '../_utils/invoice-display';
import { resolveComposerTenders, type ComposerTender } from '../_utils/invoice-composer';

export function ComposerPaymentCard({
  due,
  tenders,
  outstanding,
  onTendersChange,
  onOutstandingChange,
}: {
  due: number;
  tenders: ComposerTender[];
  outstanding: boolean;
  onTendersChange: (tenders: ComposerTender[]) => void;
  onOutstandingChange: (value: boolean) => void;
}) {
  const summary = resolveComposerTenders(tenders, due);

  function patchTender(key: string, patch: Partial<ComposerTender>) {
    onTendersChange(
      tenders.map((tender) => (tender.key === key ? { ...tender, ...patch } : tender))
    );
  }

  return (
    <Card className="shadow-fluent-4 h-fit">
      <CardHeader>
        <CardTitle className="text-base">Payment</CardTitle>
        <CardDescription>
          Split a Payment across supported methods, or leave a Balance Due.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-muted-foreground text-sm">Patient to pay</span>
          <span className="font-heading text-2xl font-semibold tabular-nums">
            {formatMoney(due)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHOD_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onTendersChange([
                  ...tenders,
                  { key: crypto.randomUUID(), method: option.value, amount: '', reference: '' },
                ])
              }
            >
              <Plus className="size-3.5" />
              {option.label}
            </Button>
          ))}
        </div>
        {tenders.map((tender, index) => (
          <div key={tender.key} className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Payment {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove Payment ${index + 1}`}
                onClick={() => onTendersChange(tenders.filter((item) => item.key !== tender.key))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor={`method-${tender.key}`} className="text-xs">
                  Method
                </Label>
                <NativeSelect
                  id={`method-${tender.key}`}
                  className="w-full"
                  value={tender.method}
                  onChange={(event) =>
                    patchTender(tender.key, {
                      method: event.target.value as ComposerTender['method'],
                    })
                  }
                >
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`amount-${tender.key}`} className="text-xs">
                  Amount
                </Label>
                <Input
                  id={`amount-${tender.key}`}
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={tender.amount}
                  onChange={(event) => patchTender(tender.key, { amount: event.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`reference-${tender.key}`} className="text-xs">
                Reference (optional)
              </Label>
              <Input
                id={`reference-${tender.key}`}
                maxLength={100}
                value={tender.reference}
                onChange={(event) => patchTender(tender.key, { reference: event.target.value })}
                placeholder="Card auth, UPI transaction, cheque no.…"
              />
            </div>
          </div>
        ))}
        <dl className="space-y-2 border-t pt-3 text-sm tabular-nums">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Collected</dt>
            <dd>{formatMoney(summary.paid)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Balance due</dt>
            <dd>{formatMoney(summary.remaining)}</dd>
          </div>
        </dl>
        <div className="flex items-start gap-2">
          <Checkbox
            id="composer-outstanding"
            checked={outstanding}
            onCheckedChange={(value) => onOutstandingChange(value === true)}
          />
          <Label
            htmlFor="composer-outstanding"
            className="text-muted-foreground text-xs leading-snug"
          >
            Leave the remaining Balance Due on the Invoice
          </Label>
        </div>
        {summary.errors.length > 0 ? (
          <ul role="alert" className="text-destructive space-y-1 text-xs">
            {summary.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
