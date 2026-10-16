import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import { ReceiptText, RefreshCcw } from 'lucide-react';

import type { ChargeItem } from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';
import {
  PAYMENT_METHOD_OPTIONS,
  formatMoney,
} from '@/app/(protected)/billing/_utils/invoice-display';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

import type { CreateVisitFormValues } from '../_utils/create-visit-form-schema';

type Props = {
  control: Control<CreateVisitFormValues>;
  errors: FieldErrors<CreateVisitFormValues>;
  setValue: UseFormSetValue<CreateVisitFormValues>;
  chargeItems: ChargeItem[];
  canBill: boolean;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
};

export function VisitBillingFields({
  control,
  errors,
  setValue,
  chargeItems,
  canBill,
  loading,
  error,
  onRetry,
}: Props) {
  const createInvoice = useWatch({ control, name: 'createInvoice' });
  const paymentClassification = useWatch({ control, name: 'paymentClassification' });
  const chargeAmount = useWatch({ control, name: 'chargeAmount' });
  const amountReceived = useWatch({ control, name: 'amountReceived' });
  const calculatedBalance = Number(chargeAmount || 0) - Number(amountReceived || 0);
  const balance =
    chargeAmount && Number.isFinite(calculatedBalance) ? Math.max(0, calculatedBalance) : null;

  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="text-primary size-5" /> Billing at Check-in
        </CardTitle>
        <CardDescription>
          Create a Visit-linked Invoice and record a Payment when money is received. Billing can
          also be completed later from the Visit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="createInvoice"
            render={({ field }) => (
              <Checkbox
                id="visit-create-invoice"
                checked={field.value}
                disabled={!canBill && !createInvoice}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
          />
          <label htmlFor="visit-create-invoice" className="space-y-1 text-sm">
            <span className="block font-medium">Create Invoice with this Visit</span>
            <span className="text-muted-foreground block">
              A partial Payment leaves a Balance Due. Reimbursement details are documentation only.
            </span>
          </label>
        </div>

        {!canBill ? (
          <Alert>
            <AlertDescription>
              Your current permissions do not allow Invoice and Payment creation at Check-in. You
              can still create the Visit and continue in Billing.
            </AlertDescription>
          </Alert>
        ) : null}

        {createInvoice && canBill ? (
          <div className="space-y-4 border-t pt-4">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                  Charge Items could not be loaded.
                  <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCcw className="size-4" /> Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}
            {!loading && !error && chargeItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No active Charge Items are available. Add one in Billing Masters or create the Visit
                without an Invoice.
              </p>
            ) : null}
            <Controller
              control={control}
              name="paymentClassification"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="visit-payment-classification">
                    Payment classification{' '}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </FieldLabel>
                  <NativeSelect {...field} id="visit-payment-classification" className="w-full">
                    <NativeSelectOption value="SELF_PAY">Cash / Self-pay</NativeSelectOption>
                    <NativeSelectOption value="REIMBURSEMENT">
                      Insurance reimbursement (Patient pays upfront)
                    </NativeSelectOption>
                  </NativeSelect>
                </Field>
              )}
            />
            {paymentClassification === 'REIMBURSEMENT' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="insurer"
                  render={({ field }) => (
                    <Field data-invalid={Boolean(errors.insurer)}>
                      <FieldLabel htmlFor="visit-insurer">
                        Insurer for reimbursement documentation
                      </FieldLabel>
                      <Input {...field} id="visit-insurer" placeholder="Insurance payer" />
                      <FieldError>{errors.insurer?.message}</FieldError>
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="policyReference"
                  render={({ field }) => (
                    <Field data-invalid={Boolean(errors.policyReference)}>
                      <FieldLabel htmlFor="visit-policy">Policy / Member Reference</FieldLabel>
                      <Input {...field} id="visit-policy" placeholder="Policy number" />
                      <FieldError>{errors.policyReference?.message}</FieldError>
                    </Field>
                  )}
                />
                <p className="text-muted-foreground text-xs sm:col-span-2">
                  The Invoice records these details for Patient reimbursement. This does not submit
                  an insurance claim.
                </p>
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="chargeItemId"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.chargeItemId)}>
                    <FieldLabel htmlFor="visit-charge-item">
                      Charge Item{' '}
                      <span aria-hidden="true" className="text-destructive">
                        *
                      </span>
                    </FieldLabel>
                    <NativeSelect
                      {...field}
                      id="visit-charge-item"
                      aria-required
                      className="w-full"
                      disabled={loading || error}
                      onChange={(event) => {
                        field.onChange(event);
                        const item = chargeItems.find(
                          (charge) => String(charge.id) === event.target.value
                        );
                        setValue('chargeAmount', item ? String(item.unitPrice) : '', {
                          shouldValidate: true,
                        });
                      }}
                    >
                      <NativeSelectOption value="">Select a Charge Item</NativeSelectOption>
                      {chargeItems.map((item) => (
                        <NativeSelectOption key={item.id} value={String(item.id)}>
                          {item.name} · {formatMoney(item.unitPrice)}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <FieldError>{errors.chargeItemId?.message}</FieldError>
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="chargeAmount"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.chargeAmount)}>
                    <FieldLabel htmlFor="visit-charge-amount">
                      Visit charge{' '}
                      <span aria-hidden="true" className="text-destructive">
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="visit-charge-amount"
                      aria-required
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                    <FieldError>{errors.chargeAmount?.message}</FieldError>
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="amountReceived"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.amountReceived)}>
                    <FieldLabel htmlFor="visit-amount-received">Amount received</FieldLabel>
                    <Input
                      {...field}
                      id="visit-amount-received"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                    <FieldError>{errors.amountReceived?.message}</FieldError>
                  </Field>
                )}
              />
              {Number(amountReceived) > 0 ? (
                <Controller
                  control={control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="visit-payment-method">
                        Payment method{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <NativeSelect {...field} id="visit-payment-method" className="w-full">
                        {PAYMENT_METHOD_OPTIONS.map((method) => (
                          <NativeSelectOption key={method.value} value={method.value}>
                            {method.label}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Field>
                  )}
                />
              ) : null}
              {Number(amountReceived) > 0 ? (
                <Controller
                  control={control}
                  name="paymentReference"
                  render={({ field }) => (
                    <Field
                      data-invalid={Boolean(errors.paymentReference)}
                      className="sm:col-span-2"
                    >
                      <FieldLabel htmlFor="visit-payment-reference">Payment reference</FieldLabel>
                      <Input
                        {...field}
                        id="visit-payment-reference"
                        placeholder="POS, transfer, or receipt reference"
                      />
                      <FieldError>{errors.paymentReference?.message}</FieldError>
                    </Field>
                  )}
                />
              ) : null}
            </div>
            <div className="bg-muted/50 flex flex-wrap justify-between gap-2 rounded-md border p-3 text-sm">
              <span className="text-muted-foreground">Remaining amount</span>
              <span className="font-mono font-semibold tabular-nums">
                {balance === null ? '—' : formatMoney(balance)}
              </span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
