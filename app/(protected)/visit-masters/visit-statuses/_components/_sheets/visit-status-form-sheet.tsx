'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { VisitStatus } from '@/app/api/lib/modules/visit-status/schemas/visit-status-schema';
import { VISIT_STATUS_CATEGORIES } from '@/app/api/lib/modules/visit-status/schemas/visit-status-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateVisitStatus } from '@/app/queries/visit-masters/useCreateVisitStatus';
import { useUpdateVisitStatus } from '@/app/queries/visit-masters/useUpdateVisitStatus';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  VISIT_STATUS_CATEGORY_LABELS,
  visitStatusFormSchema,
  type VisitStatusFormValues,
} from '../../_utils/visit-status-form-schema';

const EMPTY_DEFAULTS: VisitStatusFormValues = {
  name: '',
  code: '',
  category: 'WAITING',
  color: '#2563EB',
  description: '',
};

type VisitStatusFormSheetProps = {
  open: boolean;
  mode: 'new' | 'edit';
  statusId: number | null;
  status: VisitStatus | null;
  isResolving: boolean;
  onClose: () => void;
};

export function VisitStatusFormSheet({
  open,
  mode,
  statusId,
  status,
  isResolving,
  onClose,
}: VisitStatusFormSheetProps) {
  const createMutation = useCreateVisitStatus();
  const updateMutation = useUpdateVisitStatus();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const initializedKeyRef = useRef<string | null>(null);

  const form = useForm<VisitStatusFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DEFAULTS,
    resolver: zodResolver(visitStatusFormSchema),
  });

  const isCreating = mode === 'new';
  const isSystem = status?.isSystem ?? false;
  const isSaving = createMutation.isPending || updateMutation.isPending;
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
      category: status?.category ?? 'WAITING',
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
          description: values.description.trim() || undefined,
        });
        toast.success('Visit Status created.');
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
          description: values.description.trim() || undefined,
        },
      });
      toast.success('Visit Status updated.');
      onClose();
    } catch (error) {
      const errors = getApiErrors(error);
      setServerErrors(errors);
      toast.error(getApiErrorMessage(error));
    }
  });

  const sheetTitle = isCreating ? 'Add Visit Status' : `Edit ${status?.name ?? 'Visit Status'}`;
  const sheetDescription = isCreating
    ? 'Create a new Tenant-scoped Visit Status.'
    : isSystem
      ? 'System Visit Status · code and category cannot be changed.'
      : 'Update the Visit Status details.';

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
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="bg-muted h-10 animate-pulse rounded-md" />
              ))}
            </div>
          </div>
        ) : (
          <form
            id="visit-status-form"
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
                      {serverErrors.map((error) => (
                        <li key={error}>{error}</li>
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
                      <FieldLabel htmlFor="visit-status-name">
                        Name{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="visit-status-name"
                        {...field}
                        disabled={isSaving}
                        maxLength={100}
                        placeholder="e.g. Waiting"
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="code"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="visit-status-code">
                          Code{' '}
                          <span aria-hidden="true" className="text-destructive">
                            *
                          </span>
                        </FieldLabel>
                        <Input
                          id="visit-status-code"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          disabled={isSaving || isSystem}
                          maxLength={10}
                          placeholder="e.g. WAIT"
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
                    name="category"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="visit-status-category">
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
                            id="visit-status-category"
                            className="w-full"
                            aria-required="true"
                            aria-invalid={fieldState.invalid}
                          >
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {VISIT_STATUS_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {VISIT_STATUS_CATEGORY_LABELS[category]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  control={form.control}
                  name="color"
                  render={({ field, fieldState }) => {
                    const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(field.value);

                    return (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="visit-status-color">
                          Color{' '}
                          <span aria-hidden="true" className="text-destructive">
                            *
                          </span>
                        </FieldLabel>
                        <div className="flex items-center gap-2">
                          <label
                            aria-label="Pick a color"
                            className="shrink-0 cursor-pointer"
                            title="Pick a color"
                          >
                            <span
                              className="border-input block size-9 rounded-md border"
                              style={{ backgroundColor: isValidHex ? field.value : '#2563EB' }}
                            />
                            <input
                              type="color"
                              className="sr-only"
                              value={isValidHex ? field.value : '#2563EB'}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              disabled={isSaving}
                            />
                          </label>
                          <Input
                            id="visit-status-color"
                            {...field}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              field.onChange(val.startsWith('#') ? val : '#' + val);
                            }}
                            className="font-mono"
                            maxLength={7}
                            placeholder="#2563EB"
                            aria-required="true"
                            aria-invalid={fieldState.invalid}
                            disabled={isSaving}
                          />
                        </div>
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
                      <FieldLabel htmlFor="visit-status-description">Description</FieldLabel>
                      <Textarea
                        id="visit-status-description"
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
              <Button type="submit" form="visit-status-form" disabled={isSaving} aria-busy={isSaving}>
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
