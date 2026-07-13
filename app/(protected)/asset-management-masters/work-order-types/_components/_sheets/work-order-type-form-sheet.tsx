'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { WorkOrderType } from '@/app/api/lib/modules/work-order-type/schemas/work-order-type-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateWorkOrderType } from '@/app/queries/asset-masters/work-order-types/useCreateWorkOrderType';
import { useUpdateWorkOrderType } from '@/app/queries/asset-masters/work-order-types/useUpdateWorkOrderType';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
  workOrderTypeFormSchema,
  type WorkOrderTypeFormValues,
} from '../../_utils/work-order-type-form-schema';

const EMPTY_DEFAULTS: WorkOrderTypeFormValues = {
  name: '',
  code: '',
  color: '#2563EB',
  description: '',
};

type WorkOrderTypeFormSheetProps = {
  open: boolean;
  mode: 'new' | 'edit';
  typeId: number | null;
  type: WorkOrderType | null;
  isResolving: boolean;
  onClose: () => void;
};

export function WorkOrderTypeFormSheet({
  open,
  mode,
  typeId,
  type,
  isResolving,
  onClose,
}: WorkOrderTypeFormSheetProps) {
  const createMutation = useCreateWorkOrderType();
  const updateMutation = useUpdateWorkOrderType();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const initializedKeyRef = useRef<string | null>(null);

  const form = useForm<WorkOrderTypeFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DEFAULTS,
    resolver: zodResolver(workOrderTypeFormSchema),
  });

  const isCreating = mode === 'new';
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const sessionKey = isCreating ? 'new' : typeId === null ? null : String(typeId);

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
      name: type?.name ?? '',
      code: type?.code ?? '',
      color: type?.color ?? '#2563EB',
      description: type?.description ?? '',
    });
  }, [open, sessionKey, isResolving, type, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    try {
      if (isCreating) {
        await createMutation.mutateAsync({
          name: values.name,
          code: values.code,
          color: values.color,
<<<<<<< HEAD
          description: values.description.trim(),
=======
          description: values.description.trim() || undefined,
>>>>>>> 7a21517 (integrate Work Order Type master screen)
        });
        toast.success('Work Order Type created.');
        onClose();
        return;
      }

      if (typeId === null) {
        return;
      }

      await updateMutation.mutateAsync({
        id: typeId,
        request: {
          name: values.name,
          code: values.code,
          color: values.color,
<<<<<<< HEAD
          description: values.description.trim(),
=======
          description: values.description.trim() || undefined,
>>>>>>> 7a21517 (integrate Work Order Type master screen)
        },
      });
      toast.success('Work Order Type updated.');
      onClose();
    } catch (error) {
      const errors = getApiErrors(error);
      setServerErrors(errors);
      toast.error(getApiErrorMessage(error));
    }
  });

  const sheetTitle = isCreating ? 'Add Work Order Type' : `Edit ${type?.name ?? 'Type'}`;
  const sheetDescription = isCreating
    ? 'Create a new Tenant-scoped Work Order Type.'
    : 'Update the Work Order Type details.';

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(512px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">{sheetTitle}</SheetTitle>
          <SheetDescription>{sheetDescription}</SheetDescription>
        </SheetHeader>

        {isResolving ? (
          <div className="flex-1 p-4">
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="bg-muted h-10 animate-pulse rounded-md" />
              ))}
            </div>
          </div>
        ) : (
          <form
            id="work-order-type-form"
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
                      <FieldLabel htmlFor="work-order-type-name">
                        Name{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="work-order-type-name"
                        {...field}
                        disabled={isSaving}
                        maxLength={100}
                        placeholder="e.g. Preventive"
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
                      <FieldLabel htmlFor="work-order-type-code">
                        Code{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="work-order-type-code"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        disabled={isSaving}
                        maxLength={10}
                        placeholder="e.g. PREVENTIVE"
                        className="font-mono"
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      />
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
                        <FieldLabel htmlFor="work-order-type-color">
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
                            id="work-order-type-color"
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
                      <FieldLabel htmlFor="work-order-type-description">Description</FieldLabel>
                      <Textarea
                        id="work-order-type-description"
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
                form="work-order-type-form"
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
