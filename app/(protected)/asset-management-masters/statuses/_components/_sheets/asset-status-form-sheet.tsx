'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { AssetStatus } from '@/app/api/lib/modules/asset-status/schemas/asset-status-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateAssetStatus } from '@/app/queries/asset-masters/asset-statuses/useCreateAssetStatus';
import { useUpdateAssetStatus } from '@/app/queries/asset-masters/asset-statuses/useUpdateAssetStatus';
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
  assetStatusFormSchema,
  type AssetStatusFormValues,
} from '../../_utils/asset-status-form-schema';

const EMPTY_DEFAULTS: AssetStatusFormValues = {
  name: '',
  code: '',
  color: '#16A34A',
  description: '',
};

type AssetStatusFormSheetProps = {
  open: boolean;
  mode: 'new' | 'edit';
  statusId: number | null;
  status: AssetStatus | null;
  isResolving: boolean;
  onClose: () => void;
};

export function AssetStatusFormSheet({
  open,
  mode,
  statusId,
  status,
  isResolving,
  onClose,
}: AssetStatusFormSheetProps) {
  const createMutation = useCreateAssetStatus();
  const updateMutation = useUpdateAssetStatus();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const initializedKeyRef = useRef<string | null>(null);

  const form = useForm<AssetStatusFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DEFAULTS,
    resolver: zodResolver(assetStatusFormSchema),
  });

  const isCreating = mode === 'new';
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
      color: status?.color ?? '#16A34A',
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
          color: values.color,
          description: values.description.trim() || undefined,
        });
        toast.success('Asset Status created.');
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
          color: values.color,
          description: values.description.trim() || undefined,
        },
      });
      toast.success('Asset Status updated.');
      onClose();
    } catch (error) {
      const errors = getApiErrors(error);
      setServerErrors(errors);
      toast.error(getApiErrorMessage(error));
    }
  });

  const sheetTitle = isCreating ? 'Add Asset Status' : `Edit ${status?.name ?? 'Status'}`;
  const sheetDescription = isCreating
    ? 'Create a new Tenant-scoped Asset Status.'
    : 'Update the Asset Status details.';

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
            id="asset-status-form"
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
                      <FieldLabel htmlFor="status-name">
                        Name{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="status-name"
                        {...field}
                        disabled={isSaving}
                        maxLength={100}
                        placeholder="e.g. In Use"
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
                      <FieldLabel htmlFor="status-code">
                        Code{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="status-code"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        disabled={isSaving}
                        maxLength={10}
                        placeholder="e.g. IN_USE"
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
                        <FieldLabel htmlFor="status-color">
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
                              style={{
                                backgroundColor: isValidHex ? field.value : '#16A34A',
                              }}
                            />
                            <input
                              type="color"
                              className="sr-only"
                              value={isValidHex ? field.value : '#16A34A'}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              disabled={isSaving}
                            />
                          </label>
                          <Input
                            id="status-color"
                            {...field}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              field.onChange(val.startsWith('#') ? val : '#' + val);
                            }}
                            className="font-mono"
                            maxLength={7}
                            placeholder="#16A34A"
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
                      <FieldLabel htmlFor="status-description">Description</FieldLabel>
                      <Textarea
                        id="status-description"
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
                form="asset-status-form"
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
