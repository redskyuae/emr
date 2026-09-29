'use client';

import { MessageSquareText } from 'lucide-react';
import { Controller, type Control } from 'react-hook-form';

import type { BookAppointmentFormValues } from '@/app/(protected)/appointments/new/_utils/book-appointment-form-schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

export function RescheduleReason({ control }: { control: Control<BookAppointmentFormValues> }) {
  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <MessageSquareText className="size-4" />
          </span>
          <div>
            <CardTitle>Rescheduling reason</CardTitle>
            <CardDescription>Record why this Appointment needs a new time.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Controller
          control={control}
          name="rescheduleReason"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="reschedule-reason">
                Reason{' '}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </FieldLabel>
              <Textarea
                {...field}
                id="reschedule-reason"
                rows={3}
                maxLength={500}
                aria-required="true"
                aria-invalid={fieldState.invalid}
                placeholder="For example, Patient requested a later time."
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </CardContent>
    </Card>
  );
}
