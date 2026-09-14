'use client';

import { Stethoscope } from 'lucide-react';
import { Controller, type Control } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';

type DoctorOption = { id: string | number; name: string; specialty: string };

export function DoctorSelectionSection({
  control,
  doctors,
  disabled,
  allowNotApplicable,
  onChange,
}: {
  control: Control<BookAppointmentFormValues>;
  doctors: DoctorOption[];
  disabled?: boolean;
  allowNotApplicable?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Stethoscope className="size-4" />
          </span>
          <div>
            <CardTitle>Doctor</CardTitle>
            <CardDescription>
              {allowNotApplicable
                ? 'Optionally assign a Doctor. This does not control the Procedure schedule.'
                : 'Select the Doctor responsible for this Appointment.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Controller
          control={control}
          name="doctorId"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="appointment-doctor">
                Doctor
                {!allowNotApplicable ? (
                  <span aria-hidden="true" className="text-destructive">
                    {' '}
                    *
                  </span>
                ) : null}
              </FieldLabel>
              <NativeSelect
                id="appointment-doctor"
                name={field.name}
                ref={field.ref}
                value={field.value}
                disabled={disabled}
                aria-required={!allowNotApplicable}
                aria-invalid={fieldState.invalid}
                className="w-full"
                onBlur={field.onBlur}
                onChange={(event) => {
                  field.onChange(event);
                  onChange(event.target.value);
                }}
              >
                <NativeSelectOption value="">
                  {allowNotApplicable ? 'Select Doctor or N/A' : 'Select Doctor'}
                </NativeSelectOption>
                {allowNotApplicable ? (
                  <NativeSelectOption value="not-applicable">N/A</NativeSelectOption>
                ) : null}
                {doctors.map((doctor) => (
                  <NativeSelectOption key={doctor.id} value={String(doctor.id)}>
                    {doctor.name} · {doctor.specialty}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </CardContent>
    </Card>
  );
}
