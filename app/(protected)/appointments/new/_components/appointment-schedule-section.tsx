'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarClock, Check, LoaderCircle, RefreshCw } from 'lucide-react';
import { Controller, useFormState, type Control } from 'react-hook-form';

import { addMinutesToTime, getDurationMinutes } from '../_utils/appointment-time';
import { getAvailableEndTimes, getAvailableStartTimes } from '../_utils/appointment-slot-options';
import { BookingStatusBadge } from './booking-status-badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import type { DoctorRotaOption } from '@/app/queries/appointments/useDoctorSlots';
import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';

type TimeOption = { time: string; status: 'Available' | 'Booked' };

const GENERIC_TIMES: TimeOption[] = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
].map((time) => ({ time, status: 'Available' }));

const TIME_OPTIONS = Array.from({ length: 64 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 15;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

const DURATION_OPTIONS = [15, 30, 45, 60, 90];

export function AppointmentScheduleSection({
  control,
  rotas,
  rota,
  doctorId,
  slotDate,
  startTime,
  endTime,
  selectedRotaId,
  procedure,
  recommendedDuration,
  isLoading,
  error,
  onRetry,
  onContextChange,
  onRotaChange,
  onTimeChange,
}: {
  control: Control<BookAppointmentFormValues>;
  rotas: DoctorRotaOption[];
  rota: DoctorRotaOption | null;
  doctorId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  selectedRotaId: string;
  procedure: boolean;
  recommendedDuration: number;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onContextChange: () => void;
  onRotaChange: (value: string) => void;
  onTimeChange: (field: 'startTime' | 'endTime', value: string) => void;
}) {
  const { errors } = useFormState({ control, name: 'doctorRotaId' });
  const isUnassigned = doctorId === 'not-applicable';
  const canChooseTime = Boolean(
    doctorId && slotDate && (procedure || isUnassigned || (selectedRotaId && rota))
  );
  const timeOptions =
    !procedure && !isUnassigned && selectedRotaId ? (rota?.slots ?? []) : GENERIC_TIMES;
  const duration = getDurationMinutes(startTime, endTime);
  const consultationStartOptions = rota ? getAvailableStartTimes(rota) : [];
  const consultationEndOptions = rota ? getAvailableEndTimes(rota, startTime) : [];
  const startOptions = !procedure && !isUnassigned ? consultationStartOptions : TIME_OPTIONS;
  const endOptions =
    !procedure && !isUnassigned
      ? consultationEndOptions
      : TIME_OPTIONS.filter((time) => !startTime || time > startTime);
  const availableDurations = consultationEndOptions.map((time) =>
    getDurationMinutes(startTime, time)
  );
  const quickDurations = Array.from(new Set([...DURATION_OPTIONS, recommendedDuration]))
    .filter((minutes) =>
      procedure || isUnassigned
        ? true
        : startTime
          ? availableDurations.includes(minutes)
          : rota
            ? minutes % rota.duration === 0
            : false
    )
    .sort((left, right) => left - right);

  function selectStart(time: string) {
    onTimeChange('startTime', time);
    onTimeChange('endTime', addMinutesToTime(time, recommendedDuration));
  }

  function selectDuration(minutes: number) {
    if (!startTime) return;
    onTimeChange('endTime', addMinutesToTime(startTime, minutes));
  }

  return (
    <Card className="shadow-fluent-2 overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <CalendarClock className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle>Date & time</CardTitle>
            <CardDescription>Define the exact Appointment date and duration.</CardDescription>
          </div>
          {duration ? (
            <BookingStatusBadge tone="selected">{duration} min</BookingStatusBadge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div
          className={cn(
            'grid gap-4',
            !procedure && !isUnassigned && 'sm:grid-cols-2 sm:items-start'
          )}
        >
          <DateField control={control} onChange={onContextChange} />
          {!procedure && !isUnassigned ? (
            <RotaField
              rotas={rotas}
              value={selectedRotaId}
              disabled={!slotDate || isLoading}
              error={errors.doctorRotaId}
              onChange={onRotaChange}
            />
          ) : null}
        </div>

        <section className="bg-muted/25 space-y-4 rounded-xl border p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Appointment time</h3>
              <p className="text-muted-foreground text-xs">All times shown in GST.</p>
            </div>
            {canChooseTime ? (
              <BookingStatusBadge tone="success">
                {timeOptions.filter((option) => option.status === 'Available').length} available
              </BookingStatusBadge>
            ) : null}
          </div>

          {isLoading && doctorId && slotDate ? (
            <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm">
              <LoaderCircle className="size-4 animate-spin" /> Loading Doctor slots…
            </div>
          ) : error && doctorId && slotDate ? (
            <div className="border-destructive/25 bg-destructive/5 rounded-lg border p-4 text-sm">
              <p>{error}</p>
              <Button type="button" size="sm" variant="outline" className="mt-2" onClick={onRetry}>
                <RefreshCw className="size-3.5" /> Retry
              </Button>
            </div>
          ) : !canChooseTime ? (
            <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
              {doctorId && slotDate && !procedure && rotas.length === 0
                ? 'No Doctor slots are available for this date.'
                : `Choose a Date${!procedure && !isUnassigned ? ' and Doctor Rota' : ''}.`}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {timeOptions.map((option) => {
                  const selected = startTime === option.time;
                  const booked = option.status === 'Booked';
                  return (
                    <Button
                      key={option.time}
                      type="button"
                      size="sm"
                      variant={selected ? 'default' : 'outline'}
                      disabled={booked}
                      aria-pressed={selected}
                      aria-label={`${option.time}${booked ? ' · Booked' : ''}`}
                      onClick={() => selectStart(option.time)}
                      className={cn(
                        'font-mono text-xs',
                        booked
                          ? 'border-warning/25 bg-warning/5 text-warning line-through disabled:opacity-100'
                          : !selected &&
                              'border-success/25 bg-success/5 text-success hover:bg-success/10'
                      )}
                    >
                      {selected ? <Check className="size-3" /> : null}
                      {option.time}
                    </Button>
                  );
                })}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TimeField
                  control={control}
                  name="startTime"
                  id="appointment-start-time"
                  label="Start time"
                  options={startOptions}
                  onChange={selectStart}
                />
                <TimeField
                  control={control}
                  name="endTime"
                  id="appointment-end-time"
                  label="End time"
                  options={endOptions}
                  disabled={!startTime}
                  onChange={(value) => onTimeChange('endTime', value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground mr-1 text-xs font-medium">Duration</span>
                {quickDurations.map((minutes) => (
                  <Button
                    key={minutes}
                    type="button"
                    size="sm"
                    variant={duration === minutes ? 'default' : 'outline'}
                    disabled={!startTime}
                    aria-pressed={duration === minutes}
                    onClick={() => selectDuration(minutes)}
                    className="h-8 px-3 text-xs"
                  >
                    {minutes} min
                  </Button>
                ))}
              </div>
            </>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function DateField({
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
          <FieldLabel htmlFor="appointment-slot-date">
            Date{' '}
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          </FieldLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id="appointment-slot-date"
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

function RotaField({
  rotas,
  value,
  disabled,
  error,
  onChange,
}: {
  rotas: DoctorRotaOption[];
  value: string;
  disabled: boolean;
  error: { message?: string } | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor="doctor-rota">
        Doctor Rota{' '}
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      </FieldLabel>
      <NativeSelect
        id="doctor-rota"
        className="w-full"
        disabled={disabled}
        aria-required="true"
        aria-invalid={Boolean(error)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <NativeSelectOption value="">Select Doctor Rota</NativeSelectOption>
        {rotas.map((option) => (
          <NativeSelectOption key={option.id} value={option.id}>
            {option.name} · {option.duration} min intervals
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <FieldError errors={[error]} />
    </Field>
  );
}

function TimeField({
  control,
  name,
  id,
  label,
  options,
  disabled,
  onChange,
}: {
  control: Control<BookAppointmentFormValues>;
  name: 'startTime' | 'endTime';
  id: string;
  label: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor={id}>
            {label}{' '}
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          </FieldLabel>
          <NativeSelect
            id={id}
            name={field.name}
            ref={field.ref}
            value={field.value}
            disabled={disabled}
            aria-required="true"
            aria-invalid={fieldState.invalid}
            className="w-full font-mono"
            onBlur={field.onBlur}
            onChange={(event) => onChange(event.target.value)}
          >
            <NativeSelectOption value="">Choose time</NativeSelectOption>
            {options.map((time) => (
              <NativeSelectOption key={time} value={time}>
                {time}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
