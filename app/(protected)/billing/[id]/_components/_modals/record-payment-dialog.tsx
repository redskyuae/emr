'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import type { Invoice } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useRecordPayment } from '@/app/queries/billing/invoices/useRecordPayment';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { PAYMENT_METHOD_OPTIONS } from '../../../_utils/invoice-display';
import {
  recordPaymentFormSchema,
  type RecordPaymentFormValues,
} from '../../_utils/record-payment-form-schema';

export function RecordPaymentDialog({
  invoice,
  open,
  onClose,
}: {
  invoice: Invoice;
  open: boolean;
  onClose: () => void;
}) {
  const form = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentFormSchema),
    mode: 'onTouched',
    defaultValues: { amount: '', method: 'CASH', reference: '', notes: '' },
  });
  const recordMutation = useRecordPayment();

  const {
    control,
    register,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) {
      reset({ amount: String(invoice.balanceDue), method: 'CASH', reference: '', notes: '' });
    }
  }, [open, invoice.balanceDue, reset]);

  const handleSave = form.handleSubmit(async (values) => {
    try {
      const result = await recordMutation.mutateAsync({
        id: invoice.id,
        request: {
          amount: Number(values.amount),
          method: values.method,
          reference: values.reference || undefined,
          notes: values.notes || undefined,
        },
      });
      toast.success(`Payment ${result.data.payment.receiptNumber} recorded.`);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Record a payment against {invoice.invoiceNumber}. Balance due is{' '}
            {invoice.balanceDue.toFixed(2)}.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <Field data-invalid={Boolean(errors.amount)}>
            <FieldLabel htmlFor="payment-amount">
              Amount{' '}
              <span aria-hidden className="text-destructive">
                *
              </span>
            </FieldLabel>
            <Input
              id="payment-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              {...register('amount')}
            />
            {errors.amount ? <FieldError>{errors.amount.message}</FieldError> : null}
          </Field>

          <Controller
            control={control}
            name="method"
            render={({ field }) => (
              <Field data-invalid={Boolean(errors.method)}>
                <FieldLabel htmlFor="payment-method">
                  Method{' '}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="payment-method" aria-required className="w-full">
                    <SelectValue placeholder="Select a method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.method ? <FieldError>{errors.method.message}</FieldError> : null}
              </Field>
            )}
          />

          <Field data-invalid={Boolean(errors.reference)}>
            <FieldLabel htmlFor="payment-reference">Reference</FieldLabel>
            <Input
              id="payment-reference"
              placeholder="UPI txn / card auth / cheque no."
              {...register('reference')}
            />
            {errors.reference ? <FieldError>{errors.reference.message}</FieldError> : null}
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={recordMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={recordMutation.isPending}>
              {recordMutation.isPending ? 'Recording…' : 'Record payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
