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
  doctorId,
  onChange,
}: {
  control: Control<BookAppointmentFormValues>;
  doctors: DoctorOption[];
  doctorId: string;
  onChange: () => void;
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
              Assign the clinician before choosing Treatment details.
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
                Doctor{' '}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </FieldLabel>
              <NativeSelect
                id="appointment-doctor"
                name={field.name}
                ref={field.ref}
                value={field.value}
                aria-required="true"
                aria-invalid={fieldState.invalid}
                className="w-full"
                onBlur={field.onBlur}
                onChange={(event) => {
                  field.onChange(event);
                  onChange();
                }}
              >
                <NativeSelectOption value="">Select Doctor</NativeSelectOption>
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
        {doctorId === 'not-applicable' ? (
          <div className="border-warning/25 bg-warning/5 text-warning flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm">
            <Stethoscope className="mt-0.5 size-4 shrink-0" />
            <span>N/A selected. Continue when no Doctor is available in the list.</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
