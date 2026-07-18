'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import type { ChargeItem } from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAddInvoiceLine } from '@/app/queries/billing/invoices/useAddInvoiceLine';
import { useChargeItemsQuery } from '@/app/queries/billing/charge-items/useChargeItems';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { addLineFormSchema, type AddLineFormValues } from '../../_utils/add-line-form-schema';

const EMPTY_FORM: AddLineFormValues = { chargeItemId: '', quantity: '1', unitPrice: '' };

export function AddLineSheet({
  invoiceId,
  open,
  onClose,
}: {
  invoiceId: number;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-md"
        style={{ width: 'min(448px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">Add line</SheetTitle>
          <SheetDescription>
            Pick a Charge Item; its price is prefilled and can be overridden.
          </SheetDescription>
        </SheetHeader>
        {/* Rendered only while open so the form and search start fresh each time,
            without an effect resetting state after render. */}
        {open ? <AddLineForm invoiceId={invoiceId} onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function AddLineForm({ invoiceId, onClose }: { invoiceId: number; onClose: () => void }) {
  const form = useForm<AddLineFormValues>({
    resolver: zodResolver(addLineFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_FORM,
  });
  const addMutation = useAddInvoiceLine();
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, { wait: 300 });
  const chargeItemsQuery = useChargeItemsQuery({
    page: 1,
    limit: 50,
    isActive: true,
    query: debouncedSearch || undefined,
  });
  const chargeItems = chargeItemsQuery.data?.data ?? [];

  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = form;

  function handleSelectChargeItem(chargeItem: ChargeItem, onChange: (value: string) => void) {
    onChange(String(chargeItem.id));
    setValue('unitPrice', String(chargeItem.unitPrice));
  }

  const handleSave = form.handleSubmit(async (values) => {
    try {
      await addMutation.mutateAsync({
        id: invoiceId,
        request: {
          chargeItemId: Number(values.chargeItemId),
          quantity: Number(values.quantity),
          unitPrice: values.unitPrice === '' ? undefined : Number(values.unitPrice),
        },
      });
      toast.success('Line added.');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSave();
      }}
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <Controller
          control={control}
          name="chargeItemId"
          render={({ field }) => (
            <Field data-invalid={Boolean(errors.chargeItemId)}>
              <FieldLabel htmlFor="line-charge-item">
                Charge item{' '}
                <span aria-hidden className="text-destructive">
                  *
                </span>
              </FieldLabel>
              <Input
                placeholder="Search charge items…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search charge items"
                className="mb-2"
              />
              <Select
                value={field.value}
                onValueChange={(value) => {
                  const chargeItem = chargeItems.find((item) => String(item.id) === value);
                  if (chargeItem) {
                    handleSelectChargeItem(chargeItem, field.onChange);
                  } else {
                    field.onChange(value);
                  }
                }}
              >
                <SelectTrigger id="line-charge-item" aria-required className="w-full">
                  <SelectValue placeholder="Select a Charge Item" />
                </SelectTrigger>
                <SelectContent>
                  {chargeItems.map((chargeItem) => (
                    <SelectItem key={chargeItem.id} value={String(chargeItem.id)}>
                      {chargeItem.name} · {chargeItem.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.chargeItemId ? <FieldError>{errors.chargeItemId.message}</FieldError> : null}
            </Field>
          )}
        />

        <Field data-invalid={Boolean(errors.quantity)}>
          <FieldLabel htmlFor="line-quantity">
            Quantity{' '}
            <span aria-hidden className="text-destructive">
              *
            </span>
          </FieldLabel>
          <Input id="line-quantity" type="number" min="1" step="1" {...register('quantity')} />
          {errors.quantity ? <FieldError>{errors.quantity.message}</FieldError> : null}
        </Field>

        <Field data-invalid={Boolean(errors.unitPrice)}>
          <FieldLabel htmlFor="line-unit-price">Unit price</FieldLabel>
          <Input
            id="line-unit-price"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            {...register('unitPrice')}
          />
          {errors.unitPrice ? (
            <FieldError>{errors.unitPrice.message}</FieldError>
          ) : (
            <p className="text-muted-foreground text-xs">Prefilled from the Charge Item.</p>
          )}
        </Field>
      </div>

      <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={addMutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={addMutation.isPending}>
          <Plus className="size-4" />
          {addMutation.isPending ? 'Adding…' : 'Add line'}
        </Button>
      </SheetFooter>
    </form>
  );
}
