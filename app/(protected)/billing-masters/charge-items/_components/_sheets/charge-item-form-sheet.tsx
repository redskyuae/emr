'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { ChargeItem } from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';
import type { SaveChargeItemRequest } from '@/app/api/v1/charge-items/types';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateChargeItem } from '@/app/queries/billing/charge-items/useCreateChargeItem';
import { useUpdateChargeItem } from '@/app/queries/billing/charge-items/useUpdateChargeItem';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { CHARGE_ITEM_CATEGORY_OPTIONS } from '../../_utils/charge-item-category';
import { VISIT_CHARGE_OPTIONS } from '@/lib/visit-charge-options';
import {
  chargeItemFormSchema,
  type ChargeItemFormValues,
} from '../../_utils/charge-item-form-schema';

const EMPTY_FORM: ChargeItemFormValues = {
  name: '',
  code: '',
  category: 'CONSULTATION',
  unitPrice: '',
  cashPrice: '',
  insuranceContractPrice: '',
  effectiveDate: '',
  freeFollowUpEligible: false,
  visitChargeKind: '',
  description: '',
  isActive: true,
};

export function ChargeItemFormSheet({
  open,
  chargeItem,
  isCreating,
  onClose,
}: {
  open: boolean;
  chargeItem: ChargeItem | null;
  isCreating: boolean;
  onClose: () => void;
}) {
  const form = useForm<ChargeItemFormValues>({
    resolver: zodResolver(chargeItemFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_FORM,
  });
  const createMutation = useCreateChargeItem();
  const updateMutation = useUpdateChargeItem();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    control,
    register,
    reset,
    setError,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(
      chargeItem
        ? {
            name: chargeItem.name,
            code: chargeItem.code,
            category: chargeItem.category,
            unitPrice: String(chargeItem.unitPrice),
            cashPrice: chargeItem.cashPrice === null ? '' : String(chargeItem.cashPrice),
            insuranceContractPrice:
              chargeItem.insuranceContractPrice === null
                ? ''
                : String(chargeItem.insuranceContractPrice),
            effectiveDate: chargeItem.effectiveDate ?? '',
            freeFollowUpEligible: chargeItem.freeFollowUpEligible,
            visitChargeKind: chargeItem.visitChargeKind ?? '',
            description: chargeItem.description ?? '',
            isActive: chargeItem.isActive,
          }
        : EMPTY_FORM
    );
  }, [open, chargeItem, reset]);

  const handleSave = form.handleSubmit(async (values) => {
    const request: SaveChargeItemRequest = {
      name: values.name,
      code: values.code,
      category: values.category,
      unitPrice: Number(values.unitPrice),
      cashPrice: values.cashPrice === '' ? null : Number(values.cashPrice),
      insuranceContractPrice:
        values.insuranceContractPrice === '' ? null : Number(values.insuranceContractPrice),
      effectiveDate: values.effectiveDate || null,
      freeFollowUpEligible: values.freeFollowUpEligible,
      visitChargeKind: values.visitChargeKind || null,
      description: values.description || undefined,
      isActive: values.isActive,
    };

    try {
      if (isCreating) {
        await createMutation.mutateAsync(request);
        toast.success('Charge Item created.');
      } else if (chargeItem) {
        await updateMutation.mutateAsync({ id: chargeItem.id, request });
        toast.success('Charge Item updated.');
      }

      onClose();
    } catch (error) {
      // Map the server's field conflicts back onto the inputs that caused them.
      for (const message of getApiErrors(error)) {
        if (message.startsWith('Charge item name')) {
          setError('name', { message });
        } else if (message.startsWith('Charge item code')) {
          setError('code', { message });
        }
      }

      toast.error(getApiErrorMessage(error));
    }
  });

  const serverErrors = getApiErrors(createMutation.error ?? updateMutation.error);

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(512px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">
            {isCreating ? 'Add Charge Item' : `Edit ${chargeItem?.name ?? 'Charge Item'}`}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? 'Add a billable service or item with its prices to the catalogue.'
              : 'Update the Charge Item. Price changes never alter existing Invoices.'}
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <FieldGroup>
              {serverErrors.length > 0 ? (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertTitle>Could not save the Charge Item</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4">
                      {serverErrors.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              <Field data-invalid={Boolean(errors.name)}>
                <FieldLabel htmlFor="charge-item-name">
                  Service name{' '}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="charge-item-name"
                  aria-required
                  placeholder="General Consultation"
                  {...register('name')}
                />
                {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(errors.code)}>
                <FieldLabel htmlFor="charge-item-code">
                  CPT / service code{' '}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="charge-item-code"
                  aria-required
                  placeholder="99213 or CONS_EST"
                  {...register('code')}
                />
                {errors.code ? (
                  <FieldError>{errors.code.message}</FieldError>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Enter the verified CPT code for coded services, or a local service code. A Visit
                    type does not determine a CPT level.
                  </p>
                )}
              </Field>

              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.category)}>
                    <FieldLabel htmlFor="charge-item-category">
                      Category{' '}
                      <span aria-hidden className="text-destructive">
                        *
                      </span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="charge-item-category" aria-required className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHARGE_ITEM_CATEGORY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category ? <FieldError>{errors.category.message}</FieldError> : null}
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="visitChargeKind"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.visitChargeKind)}>
                    <FieldLabel htmlFor="charge-item-visit-kind">Visit service</FieldLabel>
                    <Select
                      value={field.value || 'NONE'}
                      onValueChange={(value) => field.onChange(value === 'NONE' ? '' : value)}
                    >
                      <SelectTrigger id="charge-item-visit-kind" className="w-full">
                        <SelectValue placeholder="No Visit service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">No Visit service</SelectItem>
                        {VISIT_CHARGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.visitChargeKind ? (
                      <FieldError>{errors.visitChargeKind.message}</FieldError>
                    ) : null}
                  </Field>
                )}
              />

              <Field data-invalid={Boolean(errors.unitPrice)}>
                <FieldLabel htmlFor="charge-item-unit-price">
                  Standard price{' '}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="charge-item-unit-price"
                  aria-required
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="500.00"
                  {...register('unitPrice')}
                />
                {errors.unitPrice ? <FieldError>{errors.unitPrice.message}</FieldError> : null}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={Boolean(errors.cashPrice)}>
                  <FieldLabel htmlFor="charge-item-cash-price">Cash price</FieldLabel>
                  <Input
                    id="charge-item-cash-price"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="Uses standard price"
                    {...register('cashPrice')}
                  />
                  {errors.cashPrice ? <FieldError>{errors.cashPrice.message}</FieldError> : null}
                </Field>
                <Field data-invalid={Boolean(errors.insuranceContractPrice)}>
                  <FieldLabel htmlFor="charge-item-insurance-price">
                    Insurance contract price
                  </FieldLabel>
                  <Input
                    id="charge-item-insurance-price"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="Not configured"
                    {...register('insuranceContractPrice')}
                  />
                  {errors.insuranceContractPrice ? (
                    <FieldError>{errors.insuranceContractPrice.message}</FieldError>
                  ) : null}
                </Field>
              </div>
              <p className="text-muted-foreground text-xs">
                Insurance contract price is held for direct insurer billing. Patient-paid
                reimbursement uses the cash price.
              </p>
              <Field data-invalid={Boolean(errors.effectiveDate)}>
                <FieldLabel htmlFor="charge-item-effective-date">Effective date</FieldLabel>
                <Input id="charge-item-effective-date" type="date" {...register('effectiveDate')} />
                {errors.effectiveDate ? (
                  <FieldError>{errors.effectiveDate.message}</FieldError>
                ) : null}
              </Field>
              <Controller
                control={control}
                name="freeFollowUpEligible"
                render={({ field }) => (
                  <Field orientation="horizontal" className="items-center justify-between">
                    <div className="space-y-0.5">
                      <FieldLabel htmlFor="charge-item-free-follow-up">
                        Free follow-up eligible
                      </FieldLabel>
                      <p className="text-muted-foreground text-xs">
                        Mark an established or follow-up consultation as eligible for a waived
                        charge on a qualifying follow-up Visit.
                      </p>
                    </div>
                    <Switch
                      id="charge-item-free-follow-up"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    {errors.freeFollowUpEligible ? (
                      <FieldError>{errors.freeFollowUpEligible.message}</FieldError>
                    ) : null}
                  </Field>
                )}
              />

              <Field data-invalid={Boolean(errors.description)}>
                <FieldLabel htmlFor="charge-item-description">Description</FieldLabel>
                <Textarea
                  id="charge-item-description"
                  rows={3}
                  placeholder="Standard outpatient consultation fee"
                  {...register('description')}
                />
                {errors.description ? <FieldError>{errors.description.message}</FieldError> : null}
              </Field>

              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Field
                    orientation="horizontal"
                    className="items-center justify-between"
                    data-invalid={Boolean(errors.isActive)}
                  >
                    <div className="space-y-0.5">
                      <FieldLabel htmlFor="charge-item-active">Active</FieldLabel>
                      <p className="text-muted-foreground text-xs">
                        Inactive items cannot be added to new Invoices.
                      </p>
                    </div>
                    <Switch
                      id="charge-item-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="size-4" />
              {isSaving ? 'Saving…' : isCreating ? 'Create Charge Item' : 'Save changes'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
