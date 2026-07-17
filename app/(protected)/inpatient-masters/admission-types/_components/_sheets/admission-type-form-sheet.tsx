'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { AdmissionType } from '@/app/api/lib/modules/admission-type/schemas/admission-type-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateAdmissionType } from '@/app/queries/inpatient-masters/admission-types/useCreateAdmissionType';
import { useUpdateAdmissionType } from '@/app/queries/inpatient-masters/admission-types/useUpdateAdmissionType';
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
  admissionTypeFormSchema,
  type AdmissionTypeFormValues,
} from '../../_utils/admission-type-form-schema';

const EMPTY_FORM: AdmissionTypeFormValues = { name: '', code: '', description: '' };

export function AdmissionTypeFormSheet({
  open,
  admissionType,
  isCreating,
  onClose,
}: {
  open: boolean;
  admissionType: AdmissionType | null;
  isCreating: boolean;
  onClose: () => void;
}) {
  const form = useForm<AdmissionTypeFormValues>({
    resolver: zodResolver(admissionTypeFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_FORM,
  });
  const createMutation = useCreateAdmissionType();
  const updateMutation = useUpdateAdmissionType();
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
      admissionType
        ? {
            name: admissionType.name,
            code: admissionType.code,
            description: admissionType.description ?? '',
          }
        : EMPTY_FORM
    );
  }, [open, admissionType, reset]);

  const handleSave = form.handleSubmit(async (values) => {
    const request = {
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    };

    try {
      if (isCreating) {
        await createMutation.mutateAsync(request);
        toast.success('Admission Type created.');
      } else if (admissionType) {
        await updateMutation.mutateAsync({ id: admissionType.id, request });
        toast.success('Admission Type updated.');
      }

      onClose();
    } catch (error) {
      // Map the server's field conflicts back onto the inputs that caused them.
      for (const message of getApiErrors(error)) {
        if (message.startsWith('Admission type name')) {
          setError('name', { message });
        } else if (message.startsWith('Admission type code')) {
          setError('code', { message });
        }
      }

      toast.error(getApiErrorMessage(error));
    }
  });

  const serverErrors = getApiErrors(createMutation.error ?? updateMutation.error);

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(512px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">
            {isCreating ? 'Add Admission Type' : `Edit ${admissionType?.name ?? 'Admission Type'}`}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? 'Create an Admission Type to classify how a Patient came to be admitted.'
              : 'Update the Admission Type details.'}
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
                  <AlertCircle className="size-4" />
                  <AlertTitle>Could not save the Admission Type</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4">
                      {serverErrors.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              <Field data-invalid={Boolean(errors.name)}>
                <FieldLabel htmlFor="admission-type-name">
                  Name{' '}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="admission-type-name"
                  aria-required
                  placeholder="Emergency"
                  {...register('name')}
                />
                {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(errors.code)}>
                <FieldLabel htmlFor="admission-type-code">
                  Code{' '}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="admission-type-code"
                  aria-required
                  placeholder="EMER"
                  {...register('code')}
                />
                {errors.code ? (
                  <FieldError>{errors.code.message}</FieldError>
                ) : (
                  <p className="text-muted-foreground text-xs">Stored in uppercase.</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="admission-type-description">Description</FieldLabel>
                <Textarea
                  id="admission-type-description"
                  rows={3}
                  placeholder="Unplanned admission through emergency attendance"
                  {...register('description')}
                />
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="size-4" />
              {isSaving ? 'Saving…' : isCreating ? 'Create Admission Type' : 'Save changes'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
