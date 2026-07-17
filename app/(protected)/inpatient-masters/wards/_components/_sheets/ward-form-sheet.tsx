'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { Ward } from '@/app/api/lib/modules/ward/schemas/ward-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateWard } from '@/app/queries/inpatient-masters/wards/useCreateWard';
import { useUpdateWard } from '@/app/queries/inpatient-masters/wards/useUpdateWard';
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
import { wardFormSchema, type WardFormValues } from '../../_utils/ward-form-schema';

const EMPTY_FORM: WardFormValues = { name: '', code: '', description: '' };

export function WardFormSheet({
  open,
  ward,
  isCreating,
  onClose,
}: {
  open: boolean;
  ward: Ward | null;
  isCreating: boolean;
  onClose: () => void;
}) {
  const form = useForm<WardFormValues>({
    resolver: zodResolver(wardFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_FORM,
  });
  const createMutation = useCreateWard();
  const updateMutation = useUpdateWard();
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
      ward ? { name: ward.name, code: ward.code, description: ward.description ?? '' } : EMPTY_FORM
    );
  }, [open, ward, reset]);

  const handleSave = form.handleSubmit(async (values) => {
    const request = {
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    };

    try {
      if (isCreating) {
        await createMutation.mutateAsync(request);
        toast.success('Ward created.');
      } else if (ward) {
        await updateMutation.mutateAsync({ id: ward.id, request });
        toast.success('Ward updated.');
      }

      onClose();
    } catch (error) {
      // Map the server's field conflicts back onto the inputs that caused them.
      for (const message of getApiErrors(error)) {
        if (message.startsWith('Ward name')) {
          setError('name', { message });
        } else if (message.startsWith('Ward code')) {
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
            {isCreating ? 'Add Ward' : `Edit ${ward?.name ?? 'Ward'}`}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? 'Create a Ward to organise inpatient Beds into a named section of the Facility.'
              : 'Update the Ward details.'}
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
                  <AlertTitle>Could not save the Ward</AlertTitle>
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
                <FieldLabel htmlFor="ward-name">
                  Name{' '}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input id="ward-name" aria-required placeholder="ICU" {...register('name')} />
                {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(errors.code)}>
                <FieldLabel htmlFor="ward-code">
                  Code{' '}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input id="ward-code" aria-required placeholder="ICU" {...register('code')} />
                {errors.code ? (
                  <FieldError>{errors.code.message}</FieldError>
                ) : (
                  <p className="text-muted-foreground text-xs">Stored in uppercase.</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="ward-description">Description</FieldLabel>
                <Textarea
                  id="ward-description"
                  rows={3}
                  placeholder="Intensive care unit"
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
              {isSaving ? 'Saving…' : isCreating ? 'Create Ward' : 'Save changes'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
