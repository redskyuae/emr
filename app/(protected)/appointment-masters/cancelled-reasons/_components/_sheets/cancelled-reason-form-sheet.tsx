'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, type UseFormSetError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { AppointmentCancelledReason } from '@/app/api/lib/modules/appointment-cancelled-reason/schemas/appointment-cancelled-reason-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateAppointmentCancelledReason } from '@/app/queries/appointment-masters/cancelled-reasons/useCreateAppointmentCancelledReason';
import { useUpdateAppointmentCancelledReason } from '@/app/queries/appointment-masters/cancelled-reasons/useUpdateAppointmentCancelledReason';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import {
  cancelledReasonFormSchema,
  type CancelledReasonFormValues,
} from '../../_utils/cancelled-reason-form-schema';

const EMPTY_DEFAULTS: CancelledReasonFormValues = { name: '', code: '', description: '' };

function applyServerErrorsToFields(
  errors: string[],
  setError: UseFormSetError<CancelledReasonFormValues>
): string[] {
  const unmatched: string[] = [];

  for (const message of errors) {
    if (/\bname\b/i.test(message)) {
      setError('name', { type: 'server', message });
    } else if (/\bcode\b/i.test(message)) {
      setError('code', { type: 'server', message });
    } else {
      unmatched.push(message);
    }
  }

  return unmatched;
}

type CancelledReasonFormSheetProps = {
  open: boolean;
  onClose: () => void;
  mode: 'new' | 'edit';
  reason: AppointmentCancelledReason | null;
  loadError?: boolean;
  onRetryLoad?: () => void;
};

export function CancelledReasonFormSheet({
  open,
  onClose,
  mode,
  reason,
  loadError = false,
  onRetryLoad,
}: CancelledReasonFormSheetProps) {
  const isCreating = mode === 'new';
  const hasNoData = !isCreating && reason === null;
  const isResolving = hasNoData && !loadError;
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const initializedKeyRef = useRef<string | null>(null);

  const createMutation = useCreateAppointmentCancelledReason();
  const updateMutation = useUpdateAppointmentCancelledReason();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CancelledReasonFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(cancelledReasonFormSchema),
    defaultValues: EMPTY_DEFAULTS,
  });
  const {
    register,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!open) {
      initializedKeyRef.current = null;
      return;
    }

    if (hasNoData) {
      return;
    }

    const sessionKey = isCreating ? 'new' : String(reason?.id ?? '');

    if (initializedKeyRef.current === sessionKey) {
      return;
    }

    initializedKeyRef.current = sessionKey;
    form.reset({
      name: reason?.name ?? '',
      code: reason?.code ?? '',
      description: reason?.description ?? '',
    });
    setServerErrors([]);
  }, [open, isCreating, hasNoData, reason, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    try {
      if (isCreating) {
        await createMutation.mutateAsync({
          name: values.name,
          code: values.code,
          description: values.description || undefined,
        });
        toast.success('Appointment Cancelled Reason created.');
        onClose();
      } else if (reason !== null) {
        await updateMutation.mutateAsync({
          id: reason.id,
          request: {
            name: values.name,
            code: values.code,
            description: values.description || undefined,
          },
        });
        toast.success('Appointment Cancelled Reason updated.');
        onClose();
      }
    } catch (error) {
      const unmatched = applyServerErrorsToFields(getApiErrors(error), form.setError);
      setServerErrors(unmatched);
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <Sheet open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(512px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">
            {isCreating
              ? 'Add Appointment Cancelled Reason'
              : `Edit ${reason?.name ?? 'Cancelled Reason'}`}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? 'Create a new cancellation reason for Appointments.'
              : 'Update the Appointment Cancelled Reason details.'}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
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

            {loadError ? (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Could not load Appointment Cancelled Reason</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>Something went wrong loading this record. Please try again.</p>
                  <Button type="button" size="sm" variant="outline" onClick={onRetryLoad}>
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : isResolving ? (
              <FieldGroup className="gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </FieldGroup>
            ) : (
              <FieldGroup className="gap-4">
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="cancelled-reason-name">
                    Name{' '}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </FieldLabel>
                  <Input
                    id="cancelled-reason-name"
                    {...register('name')}
                    disabled={isSaving}
                    maxLength={100}
                    placeholder="e.g. Patient requested"
                    aria-required="true"
                    aria-invalid={!!errors.name}
                  />
                  <FieldError errors={[errors.name]} />
                </Field>

                <Field data-invalid={!!errors.code}>
                  <FieldLabel htmlFor="cancelled-reason-code">
                    Code{' '}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </FieldLabel>
                  <Input
                    id="cancelled-reason-code"
                    {...register('code', {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        e.target.value = e.target.value.toUpperCase();
                      },
                    })}
                    disabled={isSaving}
                    maxLength={10}
                    placeholder="e.g. PAT_REQ"
                    className="font-mono"
                    aria-required="true"
                    aria-invalid={!!errors.code}
                  />
                  <FieldError errors={[errors.code]} />
                </Field>

                <Field data-invalid={!!errors.description}>
                  <FieldLabel htmlFor="cancelled-reason-description">Description</FieldLabel>
                  <Textarea
                    id="cancelled-reason-description"
                    {...register('description')}
                    disabled={isSaving}
                    rows={3}
                    placeholder="Optional description"
                  />
                  <FieldError errors={[errors.description]} />
                </Field>
              </FieldGroup>
            )}
          </div>

          <SheetFooter className="bg-background flex-row justify-end border-t p-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isResolving || loadError}
              aria-busy={isSaving || isResolving}
            >
              <Save className="size-4" />
              Save
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
