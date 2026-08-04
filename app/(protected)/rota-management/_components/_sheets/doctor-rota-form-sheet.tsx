'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, type UseFormSetError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { DoctorRota } from '@/app/api/lib/modules/doctor-rota/schemas/doctor-rota-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateDoctorRota } from '@/app/queries/rota-management/useCreateDoctorRota';
import { useUpdateDoctorRota } from '@/app/queries/rota-management/useUpdateDoctorRota';
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

import {
  doctorRotaFormSchema,
  type DoctorRotaFormValues,
} from '../../_utils/doctor-rota-form-schema';

const EMPTY_DEFAULTS: DoctorRotaFormValues = { name: '', fromTime: '', toTime: '' };

function applyServerErrorsToFields(
  errors: string[],
  setError: UseFormSetError<DoctorRotaFormValues>
): string[] {
  const unmatched: string[] = [];

  for (const message of errors) {
    if (/\bname\b/i.test(message)) {
      setError('name', { type: 'server', message });
    } else if (/\btime range\b/i.test(message)) {
      setError('toTime', { type: 'server', message });
    } else if (/\bfrom time\b/i.test(message)) {
      setError('fromTime', { type: 'server', message });
    } else if (/\bto time\b/i.test(message)) {
      setError('toTime', { type: 'server', message });
    } else {
      unmatched.push(message);
    }
  }

  return unmatched;
}

type DoctorRotaFormSheetProps = {
  open: boolean;
  onClose: () => void;
  mode: 'new' | 'edit';
  rota: DoctorRota | null;
  loadError?: boolean;
  onRetryLoad?: () => void;
};

export function DoctorRotaFormSheet({
  open,
  mode,
  rota,
  onClose,
  loadError = false,
  onRetryLoad,
}: DoctorRotaFormSheetProps) {
  const isCreating = mode === 'new';
  const hasNoData = !isCreating && rota === null;
  const isResolving = hasNoData && !loadError;
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const initializedKeyRef = useRef<string | null>(null);

  const createMutation = useCreateDoctorRota();
  const updateMutation = useUpdateDoctorRota();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const form = useForm<DoctorRotaFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(doctorRotaFormSchema),
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

    const sessionKey = isCreating ? 'new' : String(rota?.id ?? '');

    if (initializedKeyRef.current === sessionKey) {
      return;
    }

    initializedKeyRef.current = sessionKey;
    form.reset({
      name: rota?.name ?? '',
      fromTime: rota?.fromTime ?? '',
      toTime: rota?.toTime ?? '',
    });
    setServerErrors([]);
  }, [open, isCreating, hasNoData, rota, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    try {
      if (isCreating) {
        await createMutation.mutateAsync(values);
        toast.success('Doctor Rota created.');
        onClose();
      } else if (rota !== null) {
        await updateMutation.mutateAsync({ id: rota.id, request: values });
        toast.success('Doctor Rota updated.');
        onClose();
      }
    } catch (error) {
      const unmatched = applyServerErrorsToFields(getApiErrors(error), form.setError);
      setServerErrors(unmatched);
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(512px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">
            {isCreating ? 'Add Doctor Rota' : `Edit ${rota?.name ?? 'Doctor Rota'}`}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? 'Create a reusable scheduling template for Doctors.'
              : 'Update the Doctor Rota time window.'}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
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
                <AlertTitle>Could not load Doctor Rota</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>Something went wrong loading this rota. Please try again.</p>
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
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </FieldGroup>
            ) : (
              <FieldGroup className="gap-4">
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="doctor-rota-name">
                    Name{' '}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </FieldLabel>
                  <Input
                    id="doctor-rota-name"
                    {...register('name')}
                    disabled={isSaving}
                    maxLength={100}
                    placeholder="e.g. Morning Rota"
                    aria-required="true"
                    aria-invalid={!!errors.name}
                  />
                  <FieldError errors={[errors.name]} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.fromTime}>
                    <FieldLabel htmlFor="doctor-rota-from-time">
                      From time{' '}
                      <span aria-hidden="true" className="text-destructive">
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      id="doctor-rota-from-time"
                      type="time"
                      {...register('fromTime')}
                      disabled={isSaving}
                      aria-required="true"
                      aria-invalid={!!errors.fromTime}
                      className="font-mono"
                    />
                    <FieldError errors={[errors.fromTime]} />
                  </Field>

                  <Field data-invalid={!!errors.toTime}>
                    <FieldLabel htmlFor="doctor-rota-to-time">
                      To time{' '}
                      <span aria-hidden="true" className="text-destructive">
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      id="doctor-rota-to-time"
                      type="time"
                      {...register('toTime')}
                      disabled={isSaving}
                      aria-required="true"
                      aria-invalid={!!errors.toTime}
                      className="font-mono"
                    />
                    <FieldError errors={[errors.toTime]} />
                  </Field>
                </div>
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
