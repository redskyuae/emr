import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import { useEffect, useRef } from 'react';
import { ReceiptText, RefreshCcw } from 'lucide-react';

import type { ChargeItem } from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';
import type { VisitPatientType } from '@/app/api/lib/modules/visit/schemas/visit-patient-type';
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
import {
  findVisitChargeItem,
  suggestedVisitChargeKind,
  VISIT_CHARGE_OPTIONS,
  type VisitChargeKind,
} from '../_utils/visit-charge-options';

type Props = {
  control: Control<CreateVisitFormValues>;
  errors: FieldErrors<CreateVisitFormValues>;
  setValue: UseFormSetValue<CreateVisitFormValues>;
  chargeItems: ChargeItem[];
  canBill: boolean;
  canCollectPayment: boolean;
  visitTypeCode: string | null;
  patientType: VisitPatientType | null;
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
  canCollectPayment,
  visitTypeCode,
  patientType,
  loading,
  error,
  onRetry,
}: Props) {
  const createInvoice = useWatch({ control, name: 'createInvoice' });
  const paymentClassification = useWatch({ control, name: 'paymentClassification' });
  const paymentTiming = useWatch({ control, name: 'paymentTiming' });
  const chargeKind = useWatch({ control, name: 'chargeKind' });
  const chargeAmount = useWatch({ control, name: 'chargeAmount' });
  const amountReceived = useWatch({ control, name: 'amountReceived' });
  const lastSuggestedContext = useRef<string | null>(null);
  const calculatedBalance =
    Number(chargeAmount || 0) - (paymentTiming === 'NOW' ? Number(amountReceived || 0) : 0);
  const balance =
    chargeAmount && Number.isFinite(calculatedBalance) ? Math.max(0, calculatedBalance) : null;

  useEffect(() => {
    if (!createInvoice) return;
    const context = `${visitTypeCode ?? ''}:${patientType ?? ''}`;
    if (lastSuggestedContext.current === context && chargeKind) return;
    lastSuggestedContext.current = context;

    const suggestion = suggestedVisitChargeKind(visitTypeCode, patientType);
    const match = suggestion ? findVisitChargeItem(chargeItems, suggestion) : null;
    setValue('chargeKind', match && suggestion ? suggestion : '', { shouldValidate: true });
    setValue('chargeItemId', match ? String(match.id) : '', { shouldValidate: true });
    setValue('chargeAmount', match ? String(match.unitPrice) : '', { shouldValidate: true });
  }, [chargeItems, chargeKind, createInvoice, patientType, setValue, visitTypeCode]);

  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="text-primary size-5" /> Billing at Check-in
        </CardTitle>
        <CardDescription>
          Create a Visit-linked Invoice, then collect Payment now or later from Billing.
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
              Your current permissions do not allow Invoice creation with this Visit. You can create
              the Visit and continue in Billing.
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
                No active Charge Items are available. Configure the workflow prices in Billing
                Masters or create the Visit without an Invoice.
              </p>
            ) : null}
            <p className="text-muted-foreground text-sm">
              Select the Visit service. The matching active Charge Item supplies the price; you can
              adjust this Visit&apos;s charge below. Unavailable choices need setup in Billing
              Masters.
            </p>
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
                      Insurance reimbursement (Patient responsible)
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
                  an insurance claim or collect Payment unless Pay now is selected.
                </p>
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="chargeKind"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.chargeKind)}>
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
                        const item = event.target.value
                          ? findVisitChargeItem(chargeItems, event.target.value as VisitChargeKind)
                          : null;
                        setValue('chargeItemId', item ? String(item.id) : '', {
                          shouldValidate: true,
                        });
                        setValue('chargeAmount', item ? String(item.unitPrice) : '', {
                          shouldValidate: true,
                        });
                      }}
                    >
                      <NativeSelectOption value="">Select a Charge Item</NativeSelectOption>
                      {VISIT_CHARGE_OPTIONS.map((option) => {
                        const item = findVisitChargeItem(chargeItems, option.value);
                        return (
                          <NativeSelectOption
                            key={option.value}
                            value={option.value}
                            disabled={!item}
                          >
                            {option.label} ·{' '}
                            {item ? formatMoney(item.unitPrice) : 'Set up in Billing Masters'}
                          </NativeSelectOption>
                        );
                      })}
                    </NativeSelect>
                    <FieldError>{errors.chargeKind?.message}</FieldError>
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
                name="paymentTiming"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="visit-payment-timing">Payment timing</FieldLabel>
                    <NativeSelect
                      {...field}
                      id="visit-payment-timing"
                      className="w-full"
                      onChange={(event) => {
                        field.onChange(event);
                        setValue(
                          'amountReceived',
                          event.target.value === 'NOW' ? chargeAmount || '' : '0',
                          { shouldValidate: true }
                        );
                      }}
                    >
                      <NativeSelectOption value="LATER">Pay later · Balance Due</NativeSelectOption>
                      {canCollectPayment ? (
                        <NativeSelectOption value="NOW">
                          Pay now · Record Payment
                        </NativeSelectOption>
                      ) : null}
                    </NativeSelect>
                    {!canCollectPayment ? (
                      <p className="text-muted-foreground text-xs">
                        Payment recording permission is required to collect now.
                      </p>
                    ) : null}
                  </Field>
                )}
              />
              {paymentTiming === 'NOW' ? (
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
              ) : null}
              {paymentTiming === 'NOW' && Number(amountReceived) > 0 ? (
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
              {paymentTiming === 'NOW' && Number(amountReceived) > 0 ? (
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
