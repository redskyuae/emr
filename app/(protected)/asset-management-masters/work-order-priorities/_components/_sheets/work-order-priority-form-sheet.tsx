'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { WorkOrderPriority } from '@/app/api/lib/modules/work-order-priority/schemas/work-order-priority-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateWorkOrderPriority } from '@/app/queries/asset-masters/work-order-priorities/useCreateWorkOrderPriority';
import { useUpdateWorkOrderPriority } from '@/app/queries/asset-masters/work-order-priorities/useUpdateWorkOrderPriority';
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
  workOrderPriorityFormSchema,
  type WorkOrderPriorityFormValues,
} from '../../_utils/work-order-priority-form-schema';

const EMPTY_DEFAULTS: WorkOrderPriorityFormValues = {
  name: '',
  code: '',
  color: '#DC2626',
  description: '',
};

type WorkOrderPriorityFormSheetProps = {
  open: boolean;
  mode: 'new' | 'edit';
  priorityId: number | null;
  priority: WorkOrderPriority | null;
  isResolving: boolean;
  onClose: () => void;
};

export function WorkOrderPriorityFormSheet({
  open,
  mode,
  priorityId,
  priority,
  isResolving,
  onClose,
}: WorkOrderPriorityFormSheetProps) {
  const createMutation = useCreateWorkOrderPriority();
  const updateMutation = useUpdateWorkOrderPriority();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const initializedKeyRef = useRef<string | null>(null);

  const form = useForm<WorkOrderPriorityFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DEFAULTS,
    resolver: zodResolver(workOrderPriorityFormSchema),
  });

  const isCreating = mode === 'new';
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const sessionKey = isCreating ? 'new' : priorityId === null ? null : String(priorityId);

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
      name: priority?.name ?? '',
      code: priority?.code ?? '',
      color: priority?.color ?? '#DC2626',
      description: priority?.description ?? '',
    });
  }, [open, sessionKey, isResolving, priority, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    try {
      if (isCreating) {
        await createMutation.mutateAsync({
          name: values.name,
          code: values.code,
          color: values.color,
          description: values.description || undefined,
        });
        toast.success('Work Order Priority created.');
        onClose();
        return;
      }

      if (priorityId === null) {
        return;
      }

      await updateMutation.mutateAsync({
        id: priorityId,
        request: {
          name: values.name,
          code: values.code,
          color: values.color,
          description: values.description || undefined,
        },
      });
      toast.success('Work Order Priority updated.');
      onClose();
    } catch (error) {
      const errors = getApiErrors(error);
      setServerErrors(errors);
      toast.error(getApiErrorMessage(error));
    }
  });

  const sheetTitle = isCreating
    ? 'Add Work Order Priority'
    : `Edit ${priority?.name ?? 'Priority'}`;
  const sheetDescription = isCreating
    ? 'Create a new Tenant-scoped Work Order Priority.'
    : 'Update the Work Order Priority details.';

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
            id="work-order-priority-form"
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
                      <FieldLabel htmlFor="work-order-priority-name">
                        Name{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="work-order-priority-name"
                        {...field}
                        disabled={isSaving}
                        maxLength={100}
                        placeholder="e.g. High"
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
                      <FieldLabel htmlFor="work-order-priority-code">
                        Code{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="work-order-priority-code"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        disabled={isSaving}
                        maxLength={10}
                        placeholder="e.g. HIGH"
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
                        <FieldLabel htmlFor="work-order-priority-color">
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
                              backgroundColor: isValidHex ? field.value : '#DC2626',
                            }}
                          />
                          <span className="text-muted-foreground text-sm">
                            Click to choose color
                          </span>
                          <input
                            id="work-order-priority-color"
                            type="color"
                            className="sr-only"
                            value={isValidHex ? field.value : '#DC2626'}
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
                      <FieldLabel htmlFor="work-order-priority-description">Description</FieldLabel>
                      <Textarea
                        id="work-order-priority-description"
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
                form="work-order-priority-form"
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
