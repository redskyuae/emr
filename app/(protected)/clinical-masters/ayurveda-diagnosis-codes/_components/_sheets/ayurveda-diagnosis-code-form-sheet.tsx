'use client';

import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CiCircleAlert, CiFloppyDisk } from 'react-icons/ci';
import { toast } from 'sonner';

import type { AyurvedaDiagnosisCode } from '@/app/api/lib/modules/ayurveda-diagnosis-code/schemas/ayurveda-diagnosis-code-schema';
import type { SaveAyurvedaDiagnosisCodeRequest } from '@/app/api/v1/clinical-masters/ayurveda-diagnosis-codes/types';
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
  getAyurvedaDiagnosisCodeErrorField,
  type AyurvedaDiagnosisCodeFormValues,
} from '../../_utils/ayurveda-diagnosis-code-form-schema';
import { IcdDiagnosisCodeCombobox } from '../icd-diagnosis-code-combobox';

const EMPTY_FORM: AyurvedaDiagnosisCodeFormValues = {
  name: '',
  code: '',
  category: '',
  englishName: '',
  icdDiagnosisCodeId: null,
};

export function AyurvedaDiagnosisCodeFormSheet({
  open,
  ayurvedaDiagnosisCode,
  isCreating,
  onClose,
}: {
  open: boolean;
  ayurvedaDiagnosisCode: AyurvedaDiagnosisCode | null;
  isCreating: boolean;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const form = useForm<AyurvedaDiagnosisCodeFormValues>({
    resolver: zodResolver(ayurvedaDiagnosisCodeFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_FORM,
  });
  const createMutation = useCreateAyurvedaDiagnosisCode();
  const updateMutation = useUpdateAyurvedaDiagnosisCode();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    control,
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
            name: ayurvedaDiagnosisCode.name,
            code: ayurvedaDiagnosisCode.code,
            category: ayurvedaDiagnosisCode.category ?? '',
            englishName: ayurvedaDiagnosisCode.englishName ?? '',
            icdDiagnosisCodeId: ayurvedaDiagnosisCode.icdDiagnosisCode?.id ?? null,
          }
        : EMPTY_FORM
    );
  }, [open, ayurvedaDiagnosisCode, reset]);

  const handleSave = form.handleSubmit(async (values) => {
    const request: SaveAyurvedaDiagnosisCodeRequest = {
      name: values.name,
      code: values.code,
      category: values.category,
      englishName: values.englishName,
      icdDiagnosisCodeId: values.icdDiagnosisCodeId,
    };

    try {
      if (isCreating) {
        await createMutation.mutateAsync(request);
        toast.success('Ayurveda Diagnosis Code created.');
      } else if (ayurvedaDiagnosisCode) {
        await updateMutation.mutateAsync({ id: ayurvedaDiagnosisCode.id, request });
        toast.success('Ayurveda Diagnosis Code updated.');
      }

      onClose();
    } catch (error) {
      // Map the server's field errors back onto the inputs that caused them.
      for (const message of getApiErrors(error)) {
        const field = getAyurvedaDiagnosisCodeErrorField(message);

        if (field) {
          setError(field, { message });
        }
      }

      toast.error(getApiErrorMessage(error));
    }
  });

  const serverErrors = getApiErrors(createMutation.error ?? updateMutation.error);

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        ref={sheetRef}
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(512px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">
            {isCreating
              ? 'Add Ayurveda Diagnosis Code'
              : `Edit ${ayurvedaDiagnosisCode?.code ?? 'Ayurveda Diagnosis Code'}`}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? 'Add an Ayurveda diagnosis to this Tenant catalogue and map it to ICD-10-CM for insurance claims.'
              : 'Update the Ayurveda Diagnosis Code and its ICD-10-CM mapping.'}
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <FieldGroup>
              {serverErrors.length > 0 ? (
                <Alert variant="destructive">
                  <CiCircleAlert className="size-4" />
                  <AlertTitle>Could not save the Ayurveda Diagnosis Code</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4">
                      {serverErrors.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              <Field data-invalid={Boolean(errors.code)}>
                <FieldLabel htmlFor="ayurveda-diagnosis-code-code">
                  Code{' '}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="ayurveda-diagnosis-code-code"
                  aria-required
                  aria-invalid={Boolean(errors.code)}
                  maxLength={20}
                  placeholder="AYU-AMV"
                  className="font-mono"
                  {...register('code')}
                />
                {errors.code ? (
                  <FieldError>{errors.code.message}</FieldError>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Letters, numbers, hyphens and dots. Stored in uppercase.
                  </p>
                )}
              </Field>

              <Field data-invalid={Boolean(errors.name)}>
                <FieldLabel htmlFor="ayurveda-diagnosis-code-name">
                  Name{' '}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="ayurveda-diagnosis-code-name"
                  aria-required
                  aria-invalid={Boolean(errors.name)}
                  maxLength={255}
                  placeholder="Amavata"
                  {...register('name')}
                />
                {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(errors.englishName)}>
                <FieldLabel htmlFor="ayurveda-diagnosis-code-english-name">English name</FieldLabel>
                <Input
                  id="ayurveda-diagnosis-code-english-name"
                  aria-invalid={Boolean(errors.englishName)}
                  maxLength={255}
                  placeholder="Rheumatoid arthritis"
                  {...register('englishName')}
                />
                {errors.englishName ? <FieldError>{errors.englishName.message}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(errors.category)}>
                <FieldLabel htmlFor="ayurveda-diagnosis-code-category">Category</FieldLabel>
                <Input
                  id="ayurveda-diagnosis-code-category"
                  aria-invalid={Boolean(errors.category)}
                  maxLength={100}
                  placeholder="Vatavyadhi"
                  {...register('category')}
                />
                {errors.category ? <FieldError>{errors.category.message}</FieldError> : null}
              </Field>

              <Controller
                control={control}
                name="icdDiagnosisCodeId"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.icdDiagnosisCodeId)}>
                    <FieldLabel htmlFor="ayurveda-diagnosis-code-icd">
                      ICD-10-CM code for claims
                    </FieldLabel>
                    <IcdDiagnosisCodeCombobox
                      id="ayurveda-diagnosis-code-icd"
                      value={field.value}
                      invalid={Boolean(errors.icdDiagnosisCodeId)}
                      mappedOption={ayurvedaDiagnosisCode?.icdDiagnosisCode ?? null}
                      portalContainer={sheetRef}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                    />
                    {errors.icdDiagnosisCodeId ? (
                      <FieldError>{errors.icdDiagnosisCodeId.message}</FieldError>
                    ) : null}
                    <p
                      id="ayurveda-diagnosis-code-icd-help"
                      className="text-muted-foreground text-xs"
                    >
                      UAE insurance claims require an ICD-10-CM diagnosis code. Claims for this
                      Ayurveda diagnosis use the mapped code. Leave it empty if there is no suitable
                      mapping.
                    </p>
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
              <CiFloppyDisk className="size-4" />
              {isSaving
                ? 'Saving…'
                : isCreating
                  ? 'Create Ayurveda Diagnosis Code'
                  : 'Save changes'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
