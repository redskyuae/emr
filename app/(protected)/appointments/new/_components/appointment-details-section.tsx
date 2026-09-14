'use client';

import { ClipboardList } from 'lucide-react';
import { Controller, type Control, type FieldPath } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';

type Option = { id: string | number; name: string; code?: string };

export function AppointmentDetailsSection({
  control,
  modes,
  types,
  reasons,
  disabled,
}: {
  control: Control<BookAppointmentFormValues>;
  modes: Option[];
  types: Option[];
  reasons: Option[];
  disabled?: boolean;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <ClipboardList className="size-4" />
          </span>
          <div>
            <CardTitle>Appointment details</CardTitle>
            <CardDescription>Classify the Appointment for reporting and workflow.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            control={control}
            name="appointmentModeId"
            id="appointment-mode"
            label="Appointment Mode"
            options={modes}
            placeholder="Select Mode"
            disabled={disabled}
          />
          <SelectField
            control={control}
            name="appointmentTypeId"
            id="appointment-type"
            label="Appointment Type"
            options={types}
            placeholder="Select Type"
            disabled={disabled}
          />
          <SelectField
            control={control}
            name="appointmentReasonId"
            id="appointment-reason"
            label="Appointment Reason"
            options={reasons}
            placeholder="Select Reason"
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SelectField({
  control,
  name,
  id,
  label,
  options,
  placeholder,
  disabled,
}: {
  control: Control<BookAppointmentFormValues>;
  name: keyof BookAppointmentFormValues;
  id: string;
  label: string;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}{' '}
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      </FieldLabel>
      <Controller
        control={control}
        name={name as FieldPath<BookAppointmentFormValues>}
        render={({ field, fieldState }) => (
          <>
            <NativeSelect
              id={id}
              name={field.name}
              ref={field.ref}
              value={String(field.value ?? '')}
              disabled={disabled}
              aria-required="true"
              aria-invalid={fieldState.invalid}
              className="w-full"
              onBlur={field.onBlur}
              onChange={field.onChange}
            >
              <NativeSelectOption value="">{placeholder}</NativeSelectOption>
              {options.map((option) => (
                <NativeSelectOption key={option.id} value={String(option.id)}>
                  {option.name}
                  {option.code ? ` (${option.code})` : ''}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError errors={[fieldState.error]} />
          </>
        )}
      />
    </Field>
  );
}
