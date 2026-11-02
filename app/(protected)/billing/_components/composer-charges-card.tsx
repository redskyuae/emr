'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { Plus, Trash2 } from 'lucide-react';

import { useChargeItemsQuery } from '@/app/queries/billing/charge-items/useChargeItems';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { formatMoney } from '../_utils/invoice-display';
import type { ComposerLine } from '../_utils/invoice-composer';

export function ComposerChargesCard({
  lines,
  onChange,
}: {
  lines: ComposerLine[];
  onChange: (lines: ComposerLine[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, { wait: 300 });
  const chargeItemsQuery = useChargeItemsQuery({
    page: 1,
    limit: 50,
    isActive: true,
    query: debouncedSearch || undefined,
  });
  const today = new Date().toISOString().slice(0, 10);
  const chargeItems = (chargeItemsQuery.data?.data ?? []).filter(
    (item) => !item.effectiveDate || item.effectiveDate <= today
  );

  function addLine() {
    const item = chargeItems.find((chargeItem) => String(chargeItem.id) === selectedId);
    if (!item) return;
    onChange([
      ...lines,
      {
        key: crypto.randomUUID(),
        chargeItemId: item.id,
        description: item.name,
        quantity: 1,
        unitPrice: item.cashPrice ?? item.unitPrice,
      },
    ]);
    setSelectedId('');
  }

  function patchLine(key: string, patch: Partial<ComposerLine>) {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle className="text-base">Charges</CardTitle>
        <CardDescription>
          Add priced Charge Items. Each price is saved on its Invoice Line.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="charge-search">Find Charge Item</Label>
            <Input
              id="charge-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or code…"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="charge-select">Charge Item</Label>
            <NativeSelect
              id="charge-select"
              className="w-full"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              <option value="">Select a Charge Item</option>
              {chargeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.code} · {formatMoney(item.cashPrice ?? item.unitPrice)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button type="button" variant="outline" disabled={!selectedId} onClick={addLine}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
        {chargeItemsQuery.isError ? (
          <p role="alert" className="text-destructive text-sm">
            Could not load Charge Items. Try another search.
          </p>
        ) : null}
        {lines.length === 0 ? (
          <p className="text-muted-foreground rounded-md border p-4 text-sm">
            No Charges added yet.
          </p>
        ) : (
          <div className="space-y-2">
            {lines.map((line) => (
              <div
                key={line.key}
                className="grid gap-2 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_5rem_7rem_7rem_2rem] sm:items-end"
              >
                <div>
                  <p className="text-sm font-medium">{line.description}</p>
                  <p className="text-muted-foreground font-mono text-xs">
                    Charge Item #{line.chargeItemId}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`qty-${line.key}`} className="text-xs">
                    Qty
                  </Label>
                  <Input
                    id={`qty-${line.key}`}
                    type="number"
                    min="1"
                    step="1"
                    value={line.quantity}
                    onChange={(event) =>
                      patchLine(line.key, { quantity: Number(event.target.value) })
                    }
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`price-${line.key}`} className="text-xs">
                    Unit price
                  </Label>
                  <Input
                    id={`price-${line.key}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(event) =>
                      patchLine(line.key, { unitPrice: Number(event.target.value) })
                    }
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Amount</span>
                  <p className="h-8 pt-1 text-right text-sm font-semibold tabular-nums">
                    {formatMoney(line.quantity * line.unitPrice)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${line.description}`}
                  onClick={() => onChange(lines.filter((item) => item.key !== line.key))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
