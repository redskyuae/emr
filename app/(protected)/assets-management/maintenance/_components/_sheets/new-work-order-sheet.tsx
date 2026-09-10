'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useQueryState } from 'nuqs';
import { AlertCircle, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { Asset } from '@/app/api/lib/modules/asset/schemas/asset-schema';
import type { CreateWorkOrderRequest } from '@/app/api/v1/work-orders/types';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useWorkOrderPrioritiesQuery } from '@/app/queries/asset-masters/work-order-priorities/useWorkOrderPriorities';
import { useWorkOrderStatusesQuery } from '@/app/queries/asset-masters/work-order-statuses/useWorkOrderStatuses';
import { useWorkOrderTypesQuery } from '@/app/queries/asset-masters/work-order-types/useWorkOrderTypes';
import { useAssetsQuery } from '@/app/queries/assets-management/useAssets';
import { useCreateWorkOrder } from '@/app/queries/assets-management/work-orders/useCreateWorkOrder';
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
import { Textarea } from '@/components/ui/textarea';
import {
  newWorkOrderFormSchema,
  type NewWorkOrderFormValues,
} from '../../_utils/new-work-order-form-schema';

const EMPTY_DEFAULTS: NewWorkOrderFormValues = {
  assetId: '',
  typeId: '',
  priorityId: '',
  statusId: '',
  technician: '',
  dueDate: '',
  note: '',
};

function ReferenceDataAlert({
  isError,
  isEmpty,
  error,
  resourceLabel,
}: {
  isError: boolean;
  isEmpty: boolean;
  error: unknown;
  resourceLabel: string;
}) {
  if (isError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load {resourceLabel}</AlertTitle>
        <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="size-4" />
        <AlertTitle>No {resourceLabel} configured</AlertTitle>
        <AlertDescription>Configure {resourceLabel} before raising a Work Order.</AlertDescription>
      </Alert>
    );
  }

  return null;
}

export function NewWorkOrderSheet({ open }: { open: boolean }) {
  const [, setWorkOrderParam] = useQueryState('work-order');

  function close() {
    void setWorkOrderParam(null);
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? close() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl"
      >
        {open ? <NewWorkOrderSheetBody onClose={close} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function NewWorkOrderSheetBody({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateWorkOrder();
  const typesQuery = useWorkOrderTypesQuery({ limit: 999 });
  const prioritiesQuery = useWorkOrderPrioritiesQuery({ limit: 999 });
  const statusesQuery = useWorkOrderStatusesQuery({ limit: 999 });
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [debouncedAssetSearch] = useDebouncedValue(assetSearch, { wait: 300 });
  const assetsQuery = useAssetsQuery({
    page: 1,
    limit: 20,
    query: debouncedAssetSearch || undefined,
  });

  const types = typesQuery.data?.data ?? [];
  const priorities = prioritiesQuery.data?.data ?? [];
  const statuses = statusesQuery.data?.data ?? [];
  const assets = assetsQuery.data?.data ?? [];
  const isSaving = createMutation.isPending;

  const hasNoTypes = !typesQuery.isLoading && !typesQuery.isError && types.length === 0;
  const hasNoPriorities =
    !prioritiesQuery.isLoading && !prioritiesQuery.isError && priorities.length === 0;
  const hasNoStatuses = !statusesQuery.isLoading && !statusesQuery.isError && statuses.length === 0;
  const hasNoAssetsAtAll =
    !assetsQuery.isLoading && !assetsQuery.isError && assets.length === 0 && !debouncedAssetSearch;
  const hasNoAssetSearchResults =
    !assetsQuery.isLoading &&
    !assetsQuery.isError &&
    assets.length === 0 &&
    Boolean(debouncedAssetSearch);

  const referenceDataUnavailable =
    typesQuery.isLoading ||
    typesQuery.isError ||
    hasNoTypes ||
    prioritiesQuery.isLoading ||
    prioritiesQuery.isError ||
    hasNoPriorities ||
    statusesQuery.isLoading ||
    statusesQuery.isError ||
    hasNoStatuses ||
    assetsQuery.isError ||
    hasNoAssetsAtAll;

  const form = useForm<NewWorkOrderFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DEFAULTS,
    resolver: zodResolver(newWorkOrderFormSchema),
  });

  const { control, setError } = form;

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    const request: CreateWorkOrderRequest = {
      assetId: Number(values.assetId),
      typeId: Number(values.typeId),
      priorityId: Number(values.priorityId),
      statusId: Number(values.statusId),
      technician: values.technician.trim() || undefined,
      dueDate: values.dueDate || undefined,
      note: values.note.trim() || undefined,
    };

    try {
      const created = await createMutation.mutateAsync(request);
      toast.success(`Work Order ${created.data.code} created.`);
      onClose();
    } catch (error) {
      for (const message of getApiErrors(error)) {
        if (message.startsWith('Asset') || message.startsWith('Work order asset')) {
          setError('assetId', { message });
        } else if (message.startsWith('Work order type')) {
          setError('typeId', { message });
        } else if (message.startsWith('Work order priority')) {
          setError('priorityId', { message });
        } else if (message.startsWith('Work order status')) {
          setError('statusId', { message });
        }
      }

      setServerErrors(getApiErrors(error));
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
            <SheetTitle className="truncate text-xl">New work order</SheetTitle>
            <SheetDescription>
              Raise preventive, corrective, calibration, or inspection work for an Asset.
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <form
        id="new-work-order-form"
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
                <h3 className="text-sm font-semibold">Work Order details</h3>
                <p className="text-muted-foreground text-xs">
                  Identify the job and the Asset it belongs to.
                </p>
              </div>

              <ReferenceDataAlert
                isError={typesQuery.isError}
                isEmpty={hasNoTypes}
                error={typesQuery.error}
                resourceLabel="Work Order Types"
              />
              <ReferenceDataAlert
                isError={prioritiesQuery.isError}
                isEmpty={hasNoPriorities}
                error={prioritiesQuery.error}
                resourceLabel="Work Order Priorities"
              />

              <FieldGroup className="grid gap-3 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="assetId"
                  render={({ field, fieldState }) => (
                    <AssetField
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSaving}
                      error={fieldState.error?.message}
                      search={assetSearch}
                      onSearchChange={setAssetSearch}
                      assets={assets}
                      isLoading={assetsQuery.isLoading}
                      isError={assetsQuery.isError}
                      queryError={assetsQuery.error}
                      hasNoAssetsAtAll={hasNoAssetsAtAll}
                      hasNoSearchResults={hasNoAssetSearchResults}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="typeId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="work-order-type">
                        Type{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={
                          isSaving || typesQuery.isLoading || typesQuery.isError || hasNoTypes
                        }
                      >
                        <SelectTrigger
                          id="work-order-type"
                          className="w-full"
                          aria-required="true"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue
                            placeholder={typesQuery.isLoading ? 'Loading Types…' : 'Select type'}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {types.map((type) => (
                            <SelectItem key={type.id} value={String(type.id)}>
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: type.color }}
                                aria-hidden="true"
                              />
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={control}
                  name="priorityId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="work-order-priority">
                        Priority{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={
                          isSaving ||
                          prioritiesQuery.isLoading ||
                          prioritiesQuery.isError ||
                          hasNoPriorities
                        }
                      >
                        <SelectTrigger
                          id="work-order-priority"
                          className="w-full"
                          aria-required="true"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue
                            placeholder={
                              prioritiesQuery.isLoading ? 'Loading Priorities…' : 'Select priority'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map((priority) => (
                            <SelectItem key={priority.id} value={String(priority.id)}>
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: priority.color }}
                                aria-hidden="true"
                              />
                              {priority.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Assignment & schedule</h3>
                <p className="text-muted-foreground text-xs">
                  Assign ownership and planned dates for the work.
                </p>
              </div>

              <ReferenceDataAlert
                isError={statusesQuery.isError}
                isEmpty={hasNoStatuses}
                error={statusesQuery.error}
                resourceLabel="Work Order Statuses"
              />

              <FieldGroup className="grid gap-3 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="technician"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="work-order-technician">Technician</FieldLabel>
                      <Input
                        id="work-order-technician"
                        {...field}
                        disabled={isSaving}
                        maxLength={150}
                        placeholder="Bilal Ahmed"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={control}
                  name="statusId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="work-order-status">
                        Status{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={
                          isSaving ||
                          statusesQuery.isLoading ||
                          statusesQuery.isError ||
                          hasNoStatuses
                        }
                      >
                        <SelectTrigger
                          id="work-order-status"
                          className="w-full"
                          aria-required="true"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue
                            placeholder={
                              statusesQuery.isLoading ? 'Loading Statuses…' : 'Select status'
                            }
                          />
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
                  control={control}
                  name="dueDate"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="work-order-due">Due date</FieldLabel>
                      <Input id="work-order-due" type="date" {...field} disabled={isSaving} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Scope</h3>
                <p className="text-muted-foreground text-xs">
                  Describe the maintenance request and clinical impact.
                </p>
              </div>

              <Controller
                control={control}
                name="note"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="work-order-note">Note</FieldLabel>
                    <Textarea
                      id="work-order-note"
                      {...field}
                      disabled={isSaving}
                      placeholder="Describe the fault, planned maintenance, calibration scope, or inspection checklist."
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </section>
          </div>
        </div>

        <SheetFooter className="bg-background flex-row justify-end border-t p-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="new-work-order-form"
            disabled={isSaving || referenceDataUnavailable}
            aria-busy={isSaving}
          >
            <Save className="size-4" />
            Save work order
          </Button>
        </SheetFooter>
      </form>
    </>
  );
}

function AssetField({
  value,
  onChange,
  disabled,
  error,
  search,
  onSearchChange,
  assets,
  isLoading,
  isError,
  queryError,
  hasNoAssetsAtAll,
  hasNoSearchResults,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  error?: string;
  search: string;
  onSearchChange: (value: string) => void;
  assets: Asset[];
  isLoading: boolean;
  isError: boolean;
  queryError: unknown;
  hasNoAssetsAtAll: boolean;
  hasNoSearchResults: boolean;
}) {
  const selectDisabled = disabled || isLoading || isError || hasNoAssetsAtAll;

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="work-order-asset">
        Asset{' '}
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      </FieldLabel>
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search Assets…"
        aria-label="Search Assets"
        disabled={disabled}
        className="mb-2"
      />

      {isError ? (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load Assets</AlertTitle>
          <AlertDescription>{getApiErrorMessage(queryError)}</AlertDescription>
        </Alert>
      ) : hasNoAssetsAtAll ? (
        <Alert className="mb-2">
          <AlertCircle className="size-4" />
          <AlertTitle>No Assets configured</AlertTitle>
          <AlertDescription>Add an Asset before raising a Work Order.</AlertDescription>
        </Alert>
      ) : null}

      <Select value={value} onValueChange={onChange} disabled={selectDisabled}>
        <SelectTrigger
          id="work-order-asset"
          className="w-full"
          aria-required="true"
          aria-invalid={Boolean(error)}
        >
          <SelectValue placeholder={isLoading ? 'Loading Assets…' : 'Select Asset'} />
        </SelectTrigger>
        <SelectContent>
          {assets.map((asset) => (
            <SelectItem key={asset.id} value={String(asset.id)}>
              <span className="font-mono text-xs">{asset.serialNumber}</span>
              {asset.name}
              {asset.model ? ` · ${asset.model}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasNoSearchResults ? (
        <p className="text-muted-foreground text-xs">No Assets match your search.</p>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
