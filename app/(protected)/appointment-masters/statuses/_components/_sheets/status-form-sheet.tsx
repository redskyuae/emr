'use client';

import type { UseFormReturn } from 'react-hook-form';
import { AlertCircle, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import type { AppointmentStatusCategory } from '@/app/api/lib/modules/appointment-status/schemas/appointment-status-schema';

export type StatusFormValues = {
  name: string;
  code: string;
  category: AppointmentStatusCategory;
  description?: string | null;
};

const STATUS_CATEGORY_OPTIONS: { value: AppointmentStatusCategory; label: string }[] = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CHECKED_IN', label: 'Checked in' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No show' },
];

export function StatusFormSheet({
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
  form: UseFormReturn<StatusFormValues>;
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
            {isCreating ? 'Add Appointment Status' : `Edit ${editingName ?? 'Status'}`}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? 'Create a new lifecycle state for Appointments.'
              : 'Update the Appointment Status details.'}
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
                <FieldLabel htmlFor="status-name">
                  Name{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="status-name"
                  {...register('name')}
                  disabled={isSaving}
                  maxLength={100}
                  placeholder="e.g. Confirmed"
                  aria-required="true"
                  aria-invalid={!!errors.name}
                />
                <FieldError errors={[errors.name]} />
              </Field>

              <Field data-invalid={!!errors.code}>
                <FieldLabel htmlFor="status-code">
                  Code{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="status-code"
                  {...register('code', {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.toUpperCase();
                    },
                  })}
                  disabled={isSaving}
                  maxLength={10}
                  placeholder="e.g. CONFIRMED"
                  className="font-mono"
                  aria-required="true"
                  aria-invalid={!!errors.code}
                />
                <FieldError errors={[errors.code]} />
              </Field>

              <Field data-invalid={!!errors.category}>
                <FieldLabel htmlFor="status-category">
                  Category{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Select
                  value={form.watch('category')}
                  onValueChange={(value) =>
                    form.setValue('category', value as AppointmentStatusCategory, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger id="status-category" className="w-full" aria-required="true">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.category]} />
              </Field>

              <Field data-invalid={!!errors.description}>
                <FieldLabel htmlFor="status-description">Description</FieldLabel>
                <Textarea
                  id="status-description"
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
