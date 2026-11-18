'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CiCircleAlert, CiFloppyDisk } from 'react-icons/ci';
import { toast } from 'sonner';

import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import type { SaveReligionRequest } from '@/app/api/v1/religions/types';
import { type Religion } from '@/app/queries/global-references/religions/useReligions';
import { useCreateReligion } from '@/app/queries/global-references/religions/useCreateReligion';
import { useUpdateReligion } from '@/app/queries/global-references/religions/useUpdateReligion';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { religionFormSchema, type ReligionFormValues } from '../../_utils/religion-form-schema';

const EMPTY_DEFAULTS: ReligionFormValues = {
  name: '',
  code: '',
};

function hasCode(record: Religion): record is Religion & { code: string } {
  return 'code' in record;
}

// Mirrors the form while the Religion loads: a label and an input per field.
function ReligionFormSkeleton() {
  return (
    <FieldGroup className="gap-4">
      <Field>
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </Field>
      <Field>
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </Field>
    </FieldGroup>
  );
}

export function ReligionFormSheet({
  open,
  mode,
  recordId,
  record,
  isResolving,
  onClose,
}: {
  open: boolean;
  mode: 'new' | 'edit';
  recordId: number | null;
  record: Religion | null;
  isResolving: boolean;
  onClose: () => void;
}) {
  const createMutation = useCreateReligion();
  const updateMutation = useUpdateReligion();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const initializedKeyRef = useRef<string | null>(null);

  const form = useForm<ReligionFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DEFAULTS,
    resolver: zodResolver(religionFormSchema),
  });

  const isCreating = mode === 'new';
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const sessionKey = isCreating ? 'new' : recordId === null ? null : String(recordId);

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
      name: record?.name ?? '',
      code: record && hasCode(record) ? record.code : '',
    });
  }, [open, sessionKey, isResolving, record, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    const request: SaveReligionRequest = {
      name: values.name,
      code: values.code,
    };

    try {
      if (isCreating) {
        await createMutation.mutateAsync(request);
        toast.success('Religion created.');
        onClose();
        return;
      }

      if (recordId === null) {
        return;
      }

      await updateMutation.mutateAsync({
        id: recordId,
        request,
      });
      toast.success('Religion updated.');
      onClose();
    } catch (error) {
      setServerErrors(getApiErrors(error));
      toast.error(getApiErrorMessage(error));
    }
  });

  const sheetTitle = isCreating ? 'Add Religion' : `Edit ${record?.name ?? 'Religion'}`;
  const sheetDescription = isCreating ? 'Create a new Religion.' : 'Update the Religion details.';

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

        <form
          id="religion-form"
          onSubmit={onSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-4">
            <SkeletonCrossfade isLoading={isResolving} skeleton={<ReligionFormSkeleton />}>
              {serverErrors.length > 0 ? (
                <Alert variant="destructive" className="mb-4">
                  <CiCircleAlert className="size-4" />
                  <AlertTitle>Save failed</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc space-y-1 pl-4">
                      {serverErrors.map((error, index) => (
                        <li key={`${error}-${index}`}>{error}</li>
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
                      <FieldLabel htmlFor="religion-name">
                        Name{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="religion-name"
                        {...field}
                        disabled={isSaving}
                        maxLength={100}
                        placeholder="e.g. Hindu"
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
                      <FieldLabel htmlFor="religion-code">
                        Code{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="religion-code"
                        {...field}
                        onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                        disabled={isSaving}
                        maxLength={10}
                        placeholder="e.g. HIN"
                        className="font-mono"
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </SkeletonCrossfade>
          </div>

          <SheetFooter className="bg-background flex-row justify-end border-t p-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isResolving}
              aria-busy={isSaving || isResolving}
            >
              <CiFloppyDisk className="size-4" />
              Save
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
