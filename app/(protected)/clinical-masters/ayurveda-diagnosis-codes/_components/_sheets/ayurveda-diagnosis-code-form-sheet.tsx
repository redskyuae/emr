'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { AyurvedaDiagnosisCode } from '@/app/api/lib/modules/ayurveda-diagnosis-code/schemas/ayurveda-diagnosis-code-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateAyurvedaDiagnosisCode } from '@/app/queries/clinical-masters/ayurveda-diagnosis-codes/useCreateAyurvedaDiagnosisCode';
import { useUpdateAyurvedaDiagnosisCode } from '@/app/queries/clinical-masters/ayurveda-diagnosis-codes/useUpdateAyurvedaDiagnosisCode';
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
import {
  ayurvedaDiagnosisCodeFormSchema,
  type AyurvedaDiagnosisCodeFormInput,
  type AyurvedaDiagnosisCodeFormValues,
} from '../../_utils/ayurveda-diagnosis-code-form-schema';

const EMPTY_FORM: AyurvedaDiagnosisCodeFormInput = { code: '', title: '', category: '' };

export function AyurvedaDiagnosisCodeFormSheet({
  open,
  ayurvedaDiagnosisCode,
  onClose,
}: {
  open: boolean;
  ayurvedaDiagnosisCode: AyurvedaDiagnosisCode | null;
  onClose: () => void;
}) {
  const form = useForm<AyurvedaDiagnosisCodeFormInput, unknown, AyurvedaDiagnosisCodeFormValues>({
    resolver: zodResolver(ayurvedaDiagnosisCodeFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_FORM,
  });
  const createMutation = useCreateAyurvedaDiagnosisCode();
  const updateMutation = useUpdateAyurvedaDiagnosisCode();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    reset,
    setError,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(
      ayurvedaDiagnosisCode
        ? {
            code: ayurvedaDiagnosisCode.code,
            title: ayurvedaDiagnosisCode.title,
            category: ayurvedaDiagnosisCode.category ?? '',
          }
        : EMPTY_FORM
    );
  }, [open, ayurvedaDiagnosisCode, reset]);

  const handleSave = form.handleSubmit(async (values) => {
    const request = {
      code: values.code,
      title: values.title,
      category: values.category || undefined,
    };

    try {
      if (ayurvedaDiagnosisCode) {
        await updateMutation.mutateAsync({ id: ayurvedaDiagnosisCode.id, request });
        toast.success('Ayurveda Diagnosis Code updated.');
      } else {
        await createMutation.mutateAsync(request);
        toast.success('Ayurveda Diagnosis Code created.');
      }

      onClose();
    } catch (error) {
      setError('root', { message: getApiErrors(error).join(' ') });
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
            {ayurvedaDiagnosisCode
              ? `Edit ${ayurvedaDiagnosisCode.code}`
              : 'Add Ayurveda Diagnosis Code'}
          </SheetTitle>
          <SheetDescription>
            {ayurvedaDiagnosisCode
              ? 'Update the Ayurveda Diagnosis Code details.'
              : 'Add an Ayurveda diagnosis to this Tenant catalogue.'}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-4">
            {errors.root ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="size-4" />
                <AlertTitle>Save failed</AlertTitle>
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            ) : null}

            <FieldGroup className="gap-4">
              <Field data-invalid={!!errors.code}>
                <FieldLabel htmlFor="ayurveda-diagnosis-code-code">
                  Code{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="ayurveda-diagnosis-code-code"
                  {...register('code', {
                    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                      event.target.value = event.target.value.toUpperCase();
                    },
                  })}
                  disabled={isSaving}
                  maxLength={20}
                  placeholder="e.g. AYU-JVARA"
                  className="font-mono"
                  aria-required="true"
                  aria-invalid={!!errors.code}
                />
                <FieldError errors={[errors.code]} />
              </Field>

              <Field data-invalid={!!errors.title}>
                <FieldLabel htmlFor="ayurveda-diagnosis-code-title">
                  Title{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="ayurveda-diagnosis-code-title"
                  {...register('title')}
                  disabled={isSaving}
                  maxLength={255}
                  placeholder="e.g. Jvara (Fever)"
                  aria-required="true"
                  aria-invalid={!!errors.title}
                />
                <FieldError errors={[errors.title]} />
              </Field>

              <Field data-invalid={!!errors.category}>
                <FieldLabel htmlFor="ayurveda-diagnosis-code-category">Category</FieldLabel>
                <Input
                  id="ayurveda-diagnosis-code-category"
                  {...register('category')}
                  disabled={isSaving}
                  maxLength={100}
                  placeholder="Optional grouping, e.g. Digestive"
                  aria-invalid={!!errors.category}
                />
                <FieldError errors={[errors.category]} />
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="bg-background flex-row justify-end border-t p-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
              <Save className="size-4" />
              Save
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
