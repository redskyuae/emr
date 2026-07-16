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

export type DiagnosisCodeFormValues = {
  code: string;
  title: string;
  category?: string;
};

export function DiagnosisCodeFormSheet({
  open,
  onClose,
  isCreating,
  editingCode,
  form,
  serverErrors,
  isSaving,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  isCreating: boolean;
  editingCode: string | null;
  form: UseFormReturn<DiagnosisCodeFormValues>;
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
            {isCreating ? 'Add Diagnosis Code' : `Edit ${editingCode ?? 'Diagnosis Code'}`}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? 'Add an ICD-10 diagnosis code to this Tenant catalogue.'
              : 'Update the Diagnosis Code details.'}
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
              <Field data-invalid={!!errors.code}>
                <FieldLabel htmlFor="diagnosis-code-code">
                  Code{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="diagnosis-code-code"
                  {...register('code', {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.toUpperCase();
                    },
                  })}
                  disabled={isSaving}
                  maxLength={10}
                  placeholder="e.g. I10"
                  className="font-mono"
                  aria-required="true"
                  aria-invalid={!!errors.code}
                />
                <FieldError errors={[errors.code]} />
              </Field>

              <Field data-invalid={!!errors.title}>
                <FieldLabel htmlFor="diagnosis-code-title">
                  Title{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="diagnosis-code-title"
                  {...register('title')}
                  disabled={isSaving}
                  maxLength={255}
                  placeholder="e.g. Essential (primary) hypertension"
                  aria-required="true"
                  aria-invalid={!!errors.title}
                />
                <FieldError errors={[errors.title]} />
              </Field>

              <Field data-invalid={!!errors.category}>
                <FieldLabel htmlFor="diagnosis-code-category">Category</FieldLabel>
                <Input
                  id="diagnosis-code-category"
                  {...register('category')}
                  disabled={isSaving}
                  maxLength={100}
                  placeholder="Optional ICD chapter or grouping"
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
