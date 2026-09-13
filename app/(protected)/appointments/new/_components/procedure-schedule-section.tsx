'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarClock } from 'lucide-react';
import { Controller, type Control } from 'react-hook-form';

import { getDurationMinutes, getProcedureStartTimes } from '../_utils/appointment-time';
import { BookingStatusBadge } from './booking-status-badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';

const procedureStartTimes = getProcedureStartTimes();

export function ProcedureScheduleSection({
  control,
  startTime,
  endTime,
  onDateChange,
  onStartTimeChange,
}: {
  control: Control<BookAppointmentFormValues>;
  startTime: string;
  endTime: string;
  onDateChange: () => void;
  onStartTimeChange: (value: string) => void;
}) {
  const duration = getDurationMinutes(startTime, endTime);

  return (
    <Card className="shadow-fluent-2 overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="bg-procedure/10 text-procedure flex size-9 shrink-0 items-center justify-center rounded-lg">
            <CalendarClock className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle>Procedure date & time</CardTitle>
            <CardDescription>
              Choose the Procedure time directly. Doctor availability is not used for scheduling.
            </CardDescription>
          </div>
          {duration ? (
            <BookingStatusBadge tone="selected">{duration} min</BookingStatusBadge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3 sm:items-start">
          <ProcedureDateField control={control} onChange={onDateChange} />
          <Controller
            control={control}
            name="startTime"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="procedure-start-time">
                  Start time{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <NativeSelect
                  id="procedure-start-time"
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  aria-required="true"
                  aria-invalid={fieldState.invalid}
                  className="w-full font-mono"
                  onBlur={field.onBlur}
                  onChange={(event) => onStartTimeChange(event.target.value)}
                >
                  <NativeSelectOption value="">Select time</NativeSelectOption>
                  {procedureStartTimes.map((time) => (
                    <NativeSelectOption key={time} value={time}>
                      {time}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="endTime"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="procedure-end-time">End time</FieldLabel>
                <div
                  id="procedure-end-time"
                  className={cn(
                    'border-input bg-muted/35 flex h-9 items-center rounded-md border px-3 font-mono text-sm',
                    !field.value && 'text-muted-foreground'
                  )}
                  aria-live="polite"
                >
                  {field.value || 'Calculated from Session'}
                </div>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          The selected Session duration, including setup and cleaning, determines the end time. All
          times are shown in GST.
        </p>
      </CardContent>
    </Card>
  );
}

function ProcedureDateField({
  control,
  onChange,
}: {
  control: Control<BookAppointmentFormValues>;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Controller
      control={control}
      name="slotDate"
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor="procedure-date">
            Date{' '}
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          </FieldLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id="procedure-date"
                ref={field.ref}
                type="button"
                variant="outline"
                aria-required="true"
                aria-invalid={fieldState.invalid}
                className={cn(
                  'w-full justify-between font-normal',
                  !field.value && 'text-muted-foreground'
                )}
                onBlur={field.onBlur}
              >
                {field.value
                  ? format(new Date(field.value + 'T12:00:00'), 'dd MMM yyyy')
                  : 'Choose date'}
                <CalendarClock className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 motion-reduce:animate-none" align="start">
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value + 'T12:00:00') : undefined}
                defaultMonth={field.value ? new Date(field.value + 'T12:00:00') : undefined}
                onSelect={(date) => {
                  if (!date) return;
                  field.onChange(format(date, 'yyyy-MM-dd'));
                  onChange();
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
