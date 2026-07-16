'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { WorkOrderStatus } from '@/app/api/lib/modules/work-order-status/schemas/work-order-status-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateWorkOrderStatus } from '@/app/queries/asset-masters/work-order-statuses/useCreateWorkOrderStatus';
import { useUpdateWorkOrderStatus } from '@/app/queries/asset-masters/work-order-statuses/useUpdateWorkOrderStatus';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
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
import { WORK_ORDER_STATUS_CATEGORY_OPTIONS } from '../../_utils/work-order-status-category';
import {
  workOrderStatusFormSchema,
  type WorkOrderStatusFormValues,
} from '../../_utils/work-order-status-form-schema';

const EMPTY_DEFAULTS: WorkOrderStatusFormValues = {
  name: '',
  code: '',
  category: 'OPEN',
  color: '#2563EB',
  description: '',
};

type WorkOrderStatusFormSheetProps = {
  open: boolean;
  mode: 'new' | 'edit';
  statusId: number | null;
  status: WorkOrderStatus | null;
  isResolving: boolean;
  onClose: () => void;
};

export function WorkOrderStatusFormSheet({
  open,
  mode,
  statusId,
  status,
  isResolving,
  onClose,
}: WorkOrderStatusFormSheetProps) {
  const createMutation = useCreateWorkOrderStatus();
  const updateMutation = useUpdateWorkOrderStatus();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const initializedKeyRef = useRef<string | null>(null);

  const form = useForm<WorkOrderStatusFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DEFAULTS,
    resolver: zodResolver(workOrderStatusFormSchema),
  });

  const isCreating = mode === 'new';
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isSystem = status?.isSystem ?? false;
  const sessionKey = isCreating ? 'new' : statusId === null ? null : String(statusId);

  useEffect(() => {
    if (!open) {
      initializedKeyRef.current = null;
      return;
    }

    if (sessionKey === null || isResolving) {
      return;
    }

    if (initializedKeyRef.current === sessionKey) {
      return;
    }

    initializedKeyRef.current = sessionKey;
    setServerErrors([]);
    form.reset({
      name: status?.name ?? '',
      code: status?.code ?? '',
      category: status?.category ?? 'OPEN',
      color: status?.color ?? '#2563EB',
      description: status?.description ?? '',
    });
  }, [open, sessionKey, isResolving, status, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    try {
      if (isCreating) {
        await createMutation.mutateAsync({
          name: values.name,
          code: values.code,
          category: values.category,
          color: values.color,
          description: values.description.trim(),
        });
        toast.success('Work Order Status created.');
        onClose();
        return;
      }

      if (statusId === null) {
        return;
      }

      await updateMutation.mutateAsync({
        id: statusId,
        request: {
          name: values.name,
          code: values.code,
          category: values.category,
          color: values.color,
          description: values.description.trim(),
        },
      });
      toast.success('Work Order Status updated.');
      onClose();
    } catch (error) {
      const errors = getApiErrors(error);
      setServerErrors(errors);
      toast.error(getApiErrorMessage(error));
    }
  });

  const sheetTitle = isCreating ? 'Add Work Order Status' : `Edit ${status?.name ?? 'Status'}`;
  const sheetDescription = isCreating
    ? 'Create a new Tenant-scoped Work Order Status.'
    : 'Update the Work Order Status details.';

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(512px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="text-xl">{sheetTitle}</SheetTitle>
            {isSystem ? (
              <Badge variant="outline" className="bg-muted/70 uppercase">
                System
              </Badge>
            ) : null}
          </div>
          <SheetDescription>{sheetDescription}</SheetDescription>
        </SheetHeader>

        {isResolving ? (
          <div className="flex-1 p-4">
            <div className="space-y-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="bg-muted h-10 animate-pulse rounded-md" />
              ))}
            </div>
          </div>
        ) : (
          <form
            id="work-order-status-form"
            onSubmit={onSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-4">
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

              <FieldGroup className="gap-4">
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="work-order-status-name">
                        Name{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="work-order-status-name"
                        {...field}
                        disabled={isSaving}
                        maxLength={100}
                        placeholder="e.g. Awaiting Parts"
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="code"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="work-order-status-code">
                        Code{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="work-order-status-code"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        disabled={isSaving || isSystem}
                        maxLength={10}
                        placeholder="e.g. AWAITING_PARTS"
                        className="font-mono"
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      />
                      {isSystem ? (
                        <FieldDescription>
                          System Work Order Status codes cannot be changed.
                        </FieldDescription>
                      ) : null}
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="category"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="work-order-status-category">
                        Category{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSaving || isSystem}
                      >
                        <SelectTrigger
                          id="work-order-status-category"
                          className="w-full"
                          aria-required="true"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Select a Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {WORK_ORDER_STATUS_CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isSystem ? (
                        <FieldDescription>
                          System Work Order Status categories cannot be changed.
                        </FieldDescription>
                      ) : null}
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="color"
                  render={({ field, fieldState }) => {
                    const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(field.value);

                    return (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="work-order-status-color">
                          Color{' '}
                          <span aria-hidden="true" className="text-destructive">
                            *
                          </span>
                        </FieldLabel>
                        <label
                          aria-label="Pick a color"
                          className="flex w-fit cursor-pointer items-center gap-2"
                          title="Pick a color"
                        >
                          <span
                            className="border-input block size-9 shrink-0 rounded-md border"
                            style={{
                              backgroundColor: isValidHex ? field.value : '#2563EB',
                            }}
                          />
                          <span className="text-muted-foreground text-sm">
                            Click to choose color
                          </span>
                          <input
                            id="work-order-status-color"
                            type="color"
                            className="sr-only"
                            value={isValidHex ? field.value : '#2563EB'}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            disabled={isSaving}
                            aria-required="true"
                            aria-invalid={fieldState.invalid}
                          />
                        </label>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    );
                  }}
                />

                <Controller
                  control={form.control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="work-order-status-description">Description</FieldLabel>
                      <Textarea
                        id="work-order-status-description"
                        {...field}
                        disabled={isSaving}
                        rows={3}
                        placeholder="Optional description"
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </div>

            <SheetFooter className="bg-background flex-row justify-end border-t p-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="work-order-status-form"
                disabled={isSaving}
                aria-busy={isSaving}
              >
                <Save className="size-4" />
                Save
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
