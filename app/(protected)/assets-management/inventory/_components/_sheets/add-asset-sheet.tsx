'use client';

import { useState } from 'react';
import { Controller, useForm, type UseFormSetError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useAssetCategoriesQuery } from '@/app/queries/asset-masters/useAssetCategories';
import { useAssetConditionsQuery } from '@/app/queries/asset-masters/asset-conditions/useAssetConditions';
import { useAssetStatusesQuery } from '@/app/queries/asset-masters/asset-statuses/useAssetStatuses';
import { useCreateAsset } from '@/app/queries/assets-management/useCreateAsset';
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
import { addAssetFormSchema, type AddAssetFormValues } from '../../_utils/add-asset-form-schema';

const EMPTY_DEFAULTS: AddAssetFormValues = {
  name: '',
  serialNumber: '',
  categoryId: '',
  statusId: '',
  conditionId: '',
  manufacturer: '',
  model: '',
  facility: '',
  department: '',
  location: '',
  custodian: '',
  purchaseDate: '',
  warrantyExpiry: '',
  cost: '',
  currentValue: '',
  lastServiceDate: '',
  nextServiceDate: '',
  calibrationDate: '',
};

function applyServerErrorsToFields(
  errors: string[],
  setError: UseFormSetError<AddAssetFormValues>
): string[] {
  const unmatched: string[] = [];

  for (const message of errors) {
    if (/serial number/i.test(message)) {
      setError('serialNumber', { type: 'server', message });
    } else if (/\bcategory\b/i.test(message)) {
      setError('categoryId', { type: 'server', message });
    } else if (/\bstatus\b/i.test(message)) {
      setError('statusId', { type: 'server', message });
    } else if (/\bcondition\b/i.test(message)) {
      setError('conditionId', { type: 'server', message });
    } else if (/\bname\b/i.test(message)) {
      setError('name', { type: 'server', message });
    } else {
      unmatched.push(message);
    }
  }

  return unmatched;
}

type AddAssetSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function AddAssetSheet({ open, onClose }: AddAssetSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl"
      >
        {open ? <AddAssetSheetBody onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function AddAssetSheetBody({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateAsset();
  const categoriesQuery = useAssetCategoriesQuery({ limit: 999 });
  const statusesQuery = useAssetStatusesQuery({ limit: 999 });
  const conditionsQuery = useAssetConditionsQuery({ limit: 999 });
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const categories = categoriesQuery.data?.data ?? [];
  const statuses = statusesQuery.data?.data ?? [];
  const conditions = conditionsQuery.data?.data ?? [];
  const isSaving = createMutation.isPending;

  const form = useForm<AddAssetFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DEFAULTS,
    resolver: zodResolver(addAssetFormSchema),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    try {
      await createMutation.mutateAsync({
        name: values.name,
        serialNumber: values.serialNumber,
        categoryId: Number(values.categoryId),
        statusId: Number(values.statusId),
        conditionId: values.conditionId ? Number(values.conditionId) : undefined,
        manufacturer: values.manufacturer.trim() || undefined,
        model: values.model.trim() || undefined,
        facility: values.facility.trim() || undefined,
        department: values.department.trim() || undefined,
        location: values.location.trim() || undefined,
        custodian: values.custodian.trim() || undefined,
        purchaseDate: values.purchaseDate || undefined,
        warrantyExpiry: values.warrantyExpiry || undefined,
        cost: values.cost ? Number(values.cost) : undefined,
        currentValue: values.currentValue ? Number(values.currentValue) : undefined,
        lastServiceDate: values.lastServiceDate || undefined,
        nextServiceDate: values.nextServiceDate || undefined,
        calibrationDate: values.calibrationDate || undefined,
      });
      toast.success('Asset created.');
      onClose();
    } catch (error) {
      const unmatched = applyServerErrorsToFields(getApiErrors(error), form.setError);
      setServerErrors(unmatched);
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <>
      <SheetHeader className="border-b p-4 pr-12">
        <div className="flex min-w-0 items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
            <Plus className="size-4" />
          </span>
          <div className="min-w-0 space-y-1">
            <SheetTitle className="truncate text-xl">Add asset</SheetTitle>
            <SheetDescription>Register tracked equipment for the active Facility.</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <form
        id="add-asset-form"
        onSubmit={onSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {serverErrors.length > 0 ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="size-4" />
              <AlertTitle>Save failed</AlertTitle>
              <AlertDescription>
                <ul className="list-disc space-y-1 pl-4">
                  {serverErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-5">
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Asset details</h3>
                <p className="text-muted-foreground text-xs">
                  Identity, category, and lifecycle state.
                </p>
              </div>

              <FieldGroup className="grid gap-3 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-name">
                        Asset name{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="asset-name"
                        {...field}
                        disabled={isSaving}
                        maxLength={150}
                        placeholder="MRI Scanner 1.5T"
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="serialNumber"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-serial">
                        Serial number{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="asset-serial"
                        {...field}
                        disabled={isSaving}
                        maxLength={100}
                        className="font-mono"
                        placeholder="SN-MG-88421"
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="categoryId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-category">
                        Category{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSaving}
                      >
                        <SelectTrigger
                          id="asset-category"
                          className="w-full"
                          aria-required="true"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: category.color }}
                                aria-hidden="true"
                              />
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="statusId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-status">
                        Status{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSaving}
                      >
                        <SelectTrigger
                          id="asset-status"
                          className="w-full"
                          aria-required="true"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status.id} value={String(status.id)}>
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: status.color }}
                                aria-hidden="true"
                              />
                              {status.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="conditionId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-condition">Condition</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSaving}
                      >
                        <SelectTrigger id="asset-condition" className="w-full">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          {conditions.map((condition) => (
                            <SelectItem key={condition.id} value={String(condition.id)}>
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: condition.color }}
                                aria-hidden="true"
                              />
                              {condition.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="manufacturer"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-manufacturer">Manufacturer</FieldLabel>
                      <Input
                        id="asset-manufacturer"
                        {...field}
                        disabled={isSaving}
                        maxLength={150}
                        placeholder="Siemens Healthineers"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="model"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-model">Model</FieldLabel>
                      <Input
                        id="asset-model"
                        {...field}
                        disabled={isSaving}
                        maxLength={150}
                        placeholder="Magnetom Sola"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Assignment</h3>
                <p className="text-muted-foreground text-xs">
                  Where the Asset sits and who is accountable.
                </p>
              </div>

              <FieldGroup className="grid gap-3 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="facility"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-facility">Facility</FieldLabel>
                      <Input
                        id="asset-facility"
                        {...field}
                        disabled={isSaving}
                        maxLength={150}
                        placeholder="Al Noor Hospital"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="department"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-department">Department</FieldLabel>
                      <Input
                        id="asset-department"
                        {...field}
                        disabled={isSaving}
                        maxLength={150}
                        placeholder="Radiology"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="custodian"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-custodian">Custodian</FieldLabel>
                      <Input
                        id="asset-custodian"
                        {...field}
                        disabled={isSaving}
                        maxLength={150}
                        placeholder="Dr. Omar Yusuf"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="location"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-location">Location</FieldLabel>
                      <Input
                        id="asset-location"
                        {...field}
                        disabled={isSaving}
                        maxLength={200}
                        placeholder="Block A · Radiology R-12"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Service & value</h3>
                <p className="text-muted-foreground text-xs">
                  Purchase, warranty, service dates, and book value.
                </p>
              </div>

              <FieldGroup className="grid gap-3 sm:grid-cols-3">
                <Controller
                  control={form.control}
                  name="purchaseDate"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-purchase-date">Purchase date</FieldLabel>
                      <Input id="asset-purchase-date" type="date" {...field} disabled={isSaving} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="warrantyExpiry"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-warranty-expiry">Warranty expiry</FieldLabel>
                      <Input
                        id="asset-warranty-expiry"
                        type="date"
                        {...field}
                        disabled={isSaving}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="cost"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-cost">Cost</FieldLabel>
                      <Input
                        id="asset-cost"
                        inputMode="decimal"
                        {...field}
                        disabled={isSaving}
                        placeholder="7200000"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="currentValue"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-current-value">Current value</FieldLabel>
                      <Input
                        id="asset-current-value"
                        inputMode="decimal"
                        {...field}
                        disabled={isSaving}
                        placeholder="5740000"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="lastServiceDate"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-last-service-date">Last service</FieldLabel>
                      <Input
                        id="asset-last-service-date"
                        type="date"
                        {...field}
                        disabled={isSaving}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="nextServiceDate"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-next-service-date">Next service</FieldLabel>
                      <Input
                        id="asset-next-service-date"
                        type="date"
                        {...field}
                        disabled={isSaving}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="calibrationDate"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="asset-calibration-date">Calibration date</FieldLabel>
                      <Input
                        id="asset-calibration-date"
                        type="date"
                        {...field}
                        disabled={isSaving}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </section>
          </div>
        </div>

        <SheetFooter className="bg-background flex-row justify-end border-t p-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form="add-asset-form" disabled={isSaving} aria-busy={isSaving}>
            <Save className="size-4" />
            Save asset
          </Button>
        </SheetFooter>
      </form>
    </>
  );
}
