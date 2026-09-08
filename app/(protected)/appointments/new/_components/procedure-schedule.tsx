'use client';

import { Clock3 } from 'lucide-react';
import { Controller, type Control } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';
import { DateField } from './appointment-details-section';

export function ProcedureSchedule({
  control,
  session,
  onScheduleChange,
  onEndTime,
}: {
  control: Control<BookAppointmentFormValues>;
  session: { duration: number; setupMinutes: number; cleaningMinutes: number } | null;
  onScheduleChange: () => void;
  onEndTime: (value: string) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Clock3 className="size-4" />
          </span>
          <div>
            <CardTitle>Date & time</CardTitle>
            <CardDescription>Includes setup and cleaning time.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <DateField control={control} onChange={onScheduleChange} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="startTime"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="start-time">
                  Start time{' '}
                  <span aria-hidden="true" className="text-destructive">
                    {' '}
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="start-time"
                  type="time"
                  disabled={!session}
                  {...field}
                  aria-required="true"
                  aria-invalid={fieldState.invalid}
                  onChange={(event) => {
                    field.onChange(event);
                    onScheduleChange();
                    const [hours, minutes] = event.target.value.split(':').map(Number);
                    if (!event.target.value) onEndTime('');
                    if (session && Number.isFinite(hours) && Number.isFinite(minutes)) {
                      const end = new Date(
                        2026,
                        0,
                        1,
                        hours,
                        minutes + session.duration + session.setupMinutes + session.cleaningMinutes
                      );
                      onEndTime(
                        `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
                      );
                    }
                  }}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="endTime"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="end-time">
                  Calculated end time{' '}
                  <span aria-hidden="true" className="text-destructive">
                    {' '}
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="end-time"
                  type="time"
                  readOnly
                  {...field}
                  className="bg-muted/50"
                  aria-required="true"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>
        <div className="bg-muted/35 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
          <span className="text-muted-foreground">Reserved duration</span>
          <span className="font-mono font-medium">
            {session
              ? `${session.duration} min + ${session.setupMinutes + session.cleaningMinutes} min buffer`
              : 'Choose a Treatment first'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
