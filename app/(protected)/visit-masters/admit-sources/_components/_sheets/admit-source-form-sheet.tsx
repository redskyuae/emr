'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { AdmitSource } from '@/app/api/lib/modules/admit-source/schemas/admit-source-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateAdmitSource } from '@/app/queries/visit-masters/admit-sources/useCreateAdmitSource';
import { useUpdateAdmitSource } from '@/app/queries/visit-masters/admit-sources/useUpdateAdmitSource';
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
  admitSourceFormSchema,
  type AdmitSourceFormValues,
} from '../../_utils/admit-source-form-schema';

const EMPTY_FORM: AdmitSourceFormValues = { name: '', code: '', description: '' };

export function AdmitSourceFormSheet({
  open,
  admitSource,
  isCreating,
  onClose,
}: {
  open: boolean;
  admitSource: AdmitSource | null;
  isCreating: boolean;
  onClose: () => void;
}) {
  const form = useForm<AdmitSourceFormValues>({
    resolver: zodResolver(admitSourceFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_FORM,
  });
  const createMutation = useCreateAdmitSource();
  const updateMutation = useUpdateAdmitSource();
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
      admitSource
        ? {
            name: admitSource.name,
            code: admitSource.code,
            description: admitSource.description ?? '',
          }
        : EMPTY_FORM
    );
  }, [open, admitSource, reset]);

  const handleSave = form.handleSubmit(async (values) => {
    const request = {
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    };

    try {
      if (isCreating) {
        await createMutation.mutateAsync(request);
        toast.success('Admit Source created.');
      } else if (admitSource) {
        await updateMutation.mutateAsync({ id: admitSource.id, request });
        toast.success('Admit Source updated.');
      }

      onClose();
    } catch (error) {
      // Map the server's field conflicts back onto the inputs that caused them.
      for (const message of getApiErrors(error)) {
        if (message.startsWith('Admit source name')) {
          setError('name', { message });
        } else if (message.startsWith('Admit source code')) {
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
            {isCreating ? 'Add Admit Source' : `Edit ${admitSource?.name ?? 'Admit Source'}`}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? 'Create an Admit Source to record how a Patient came to a Visit.'
              : 'Update the Admit Source details.'}
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
                  <AlertTitle>Could not save the Admit Source</AlertTitle>
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
                <FieldLabel htmlFor="admit-source-name">
                  Name{' '}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="admit-source-name"
                  aria-required
                  placeholder="Doctor Referral"
                  {...register('name')}
                />
                {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(errors.code)}>
                <FieldLabel htmlFor="admit-source-code">
                  Code{' '}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="admit-source-code"
                  aria-required
                  placeholder="DOCREF"
                  {...register('code')}
                />
                {errors.code ? (
                  <FieldError>{errors.code.message}</FieldError>
                ) : (
                  <p className="text-muted-foreground text-xs">Stored in uppercase.</p>
                )}
              </Field>

              <Field data-invalid={Boolean(errors.description)}>
                <FieldLabel htmlFor="admit-source-description">Description</FieldLabel>
                <Textarea
                  id="admit-source-description"
                  maxLength={500}
                  rows={3}
                  data-invalid={Boolean(errors.description)}
                  aria-invalid={Boolean(errors.description)}
                  placeholder="Referred by an external Doctor"
                  {...register('description')}
                />
                {errors.description ? <FieldError>{errors.description.message}</FieldError> : null}
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="size-4" />
              {isSaving ? 'Saving…' : isCreating ? 'Create Admit Source' : 'Save changes'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
