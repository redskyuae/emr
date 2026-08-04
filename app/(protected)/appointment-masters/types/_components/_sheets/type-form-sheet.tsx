'use client';

import type { UseFormReturn } from 'react-hook-form';
import { AlertCircle, Save } from 'lucide-react';
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

export type TypeFormValues = {
  name: string;
  code: string;
  description?: string | null;
};

export function TypeFormSheet({
  open,
  onClose,
  isCreating,
  editingName,
  form,
  serverErrors,
  isSaving,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  isCreating: boolean;
  editingName: string | null;
  form: UseFormReturn<TypeFormValues>;
  serverErrors: string[];
  isSaving: boolean;
  onSave: () => void;
}) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Sheet open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(512px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">
            {isCreating ? 'Add Appointment Type' : `Edit ${editingName ?? 'Type'}`}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? 'Create a new clinical category or visit type for Appointments.'
              : 'Update the Appointment Type details.'}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
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

            <FieldGroup className="gap-4">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="type-name">Name</FieldLabel>
                <Input
                  id="type-name"
                  {...register('name')}
                  disabled={isSaving}
                  maxLength={100}
                  placeholder="e.g. Follow-up"
                />
                <FieldError errors={[errors.name]} />
              </Field>

              <Field data-invalid={!!errors.code}>
                <FieldLabel htmlFor="type-code">Code</FieldLabel>
                <Input
                  id="type-code"
                  {...register('code', {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.toUpperCase();
                    },
                  })}
                  disabled={isSaving}
                  maxLength={10}
                  placeholder="e.g. FOLLOW_UP"
                  className="font-mono"
                />
                <FieldError errors={[errors.code]} />
              </Field>

              <Field data-invalid={!!errors.description}>
                <FieldLabel htmlFor="type-description">Description</FieldLabel>
                <Textarea
                  id="type-description"
                  {...register('description')}
                  disabled={isSaving}
                  rows={3}
                  placeholder="Optional description"
                />
                <FieldError errors={[errors.description]} />
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
