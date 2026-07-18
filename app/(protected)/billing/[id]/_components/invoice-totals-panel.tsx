'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

import type { Invoice } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useUpdateDraftInvoice } from '@/app/queries/billing/invoices/useUpdateDraftInvoice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatMoney } from '../../_utils/invoice-display';

export function InvoiceTotalsPanel({ invoice }: { invoice: Invoice }) {
  const isDraft = invoice.status === 'DRAFT';
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState(String(invoice.discountAmount));
  const updateMutation = useUpdateDraftInvoice();

  async function saveDiscount() {
    const amount = Number(discountInput);

    if (Number.isNaN(amount) || amount < 0) {
      toast.error('Discount must be zero or more.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: invoice.id,
        request: { discountAmount: amount, notes: invoice.notes },
      });
      toast.success('Discount updated.');
      setEditingDiscount(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatMoney(invoice.subtotal)}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Discount</span>
          {isDraft && editingDiscount ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={discountInput}
                onChange={(event) => setDiscountInput(event.target.value)}
                className="h-8 w-28 text-right"
                aria-label="Discount amount"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => void saveDiscount()}
                disabled={updateMutation.isPending}
              >
                Save
              </Button>
            </div>
          ) : (
            <span className="flex items-center gap-2 tabular-nums">
              {formatMoney(invoice.discountAmount)}
              {isDraft ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Edit discount"
                  onClick={() => {
                    setDiscountInput(String(invoice.discountAmount));
                    setEditingDiscount(true);
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
              ) : null}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-3 font-medium">
          <span>Grand total</span>
          <span className="tabular-nums">{formatMoney(invoice.grandTotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Amount paid</span>
          <span className="tabular-nums">{formatMoney(invoice.amountPaid)}</span>
        </div>
        <div className="flex items-center justify-between text-base font-semibold">
          <span>Balance due</span>
          <span className="tabular-nums">{formatMoney(invoice.balanceDue)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
