'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateVisitType } from '@/app/queries/visit-masters/visit-types/useCreateVisitType';
import { useUpdateVisitType } from '@/app/queries/visit-masters/visit-types/useUpdateVisitType';
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
import { visitTypeFormSchema, type VisitTypeFormValues } from '../../_utils/visit-type-form-schema';

const EMPTY_FORM: VisitTypeFormValues = { name: '', code: '', description: '' };

export function VisitTypeFormSheet({
  open,
  visitType,
  isCreating,
  onClose,
}: {
  open: boolean;
  visitType: VisitType | null;
  isCreating: boolean;
  onClose: () => void;
}) {
  const form = useForm<VisitTypeFormValues>({
    resolver: zodResolver(visitTypeFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_FORM,
  });
  const createMutation = useCreateVisitType();
  const updateMutation = useUpdateVisitType();
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
      visitType
        ? { name: visitType.name, code: visitType.code, description: visitType.description ?? '' }
        : EMPTY_FORM
    );
  }, [open, visitType, reset]);

  const handleSave = form.handleSubmit(async (values) => {
    const request = {
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    };

    try {
      if (isCreating) {
        await createMutation.mutateAsync(request);
        toast.success('Visit Type created.');
      } else if (visitType) {
        await updateMutation.mutateAsync({ id: visitType.id, request });
        toast.success('Visit Type updated.');
      }

      onClose();
    } catch (error) {
      // Map the server's field conflicts back onto the inputs that caused them.
      for (const message of getApiErrors(error)) {
        if (message.startsWith('Visit type name')) {
          setError('name', { message });
        } else if (message.startsWith('Visit type code')) {
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
            {isCreating ? 'Add Visit Type' : `Edit ${visitType?.name ?? 'Visit Type'}`}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? 'Create a VisitType to classify the clinical nature of a Visit.'
              : 'Update the Visit Type details.'}
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
                  <AlertTitle>Could not save the Visit Type</AlertTitle>
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
                <FieldLabel htmlFor="visit-type-name">
                  Name{' '}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="visit-type-name"
                  aria-required
                  placeholder="OPD Consultation"
                  {...register('name')}
                />
                {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(errors.code)}>
                <FieldLabel htmlFor="visit-type-code">
                  Code{' '}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input id="visit-type-code" aria-required placeholder="OPD" {...register('code')} />
                {errors.code ? (
                  <FieldError>{errors.code.message}</FieldError>
                ) : (
                  <p className="text-muted-foreground text-xs">Stored in uppercase.</p>
                )}
              </Field>

              <Field data-invalid={Boolean(errors.description)}>
                <FieldLabel htmlFor="visit-type-description">Description</FieldLabel>
                <Textarea
                  id="visit-type-description"
                  maxLength={500}
                  rows={3}
                  data-invalid={Boolean(errors.description)}
                  aria-invalid={Boolean(errors.description)}
                  placeholder="Standard outpatient consultation"
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
              {isSaving ? 'Saving…' : isCreating ? 'Create Visit Type' : 'Save changes'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
