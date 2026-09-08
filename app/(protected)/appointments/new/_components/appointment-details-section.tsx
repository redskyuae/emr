'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarClock, Clock3 } from 'lucide-react';
import { Controller, useFormState, type Control, type FieldPath } from 'react-hook-form';

import { BookingStatusBadge } from './booking-status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';
import type { DemoRota } from './book-appointment-demo-data';

type Option = { id: string | number; name: string; code?: string };

export function AppointmentDetailsSection({
  control,
  doctors,
  modes,
  types,
  reasons,
  onScheduleChange,
}: {
  control: Control<BookAppointmentFormValues>;
  doctors: Option[];
  modes: Option[];
  types: Option[];
  reasons: Option[];
  onScheduleChange: () => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <CalendarClock className="size-4" />
          </span>
          <div>
            <CardTitle>Appointment details</CardTitle>
            <CardDescription>Choose a Doctor, date, and appointment details.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            control={control}
            name="doctorId"
            id="appointment-doctor"
            label="Doctor"
            options={doctors}
            placeholder="Select Doctor"
            required
            onChange={onScheduleChange}
          />
          <DateField control={control} onChange={onScheduleChange} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            control={control}
            name="appointmentModeId"
            id="appointment-mode"
            label="Appointment Mode"
            options={modes}
            placeholder="Select Mode"
            required
          />
          <SelectField
            control={control}
            name="appointmentTypeId"
            id="appointment-type"
            label="Appointment Type"
            options={types}
            placeholder="Select Type"
            required
          />
          <SelectField
            control={control}
            name="appointmentReasonId"
            id="appointment-reason"
            label="Appointment Reason"
            options={reasons}
            placeholder="Select Reason"
            required
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function DateField({
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
                onBlur={field.onBlur}
                aria-required="true"
                aria-invalid={fieldState.invalid}
                className={cn(
                  'w-full justify-between font-normal',
                  !field.value && 'text-muted-foreground'
                )}
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

function SelectField({
  control,
  name,
  id,
  label,
  options,
  placeholder,
  required,
  onChange,
}: {
  control: Control<BookAppointmentFormValues>;
  name: keyof BookAppointmentFormValues;
  id: string;
  label: string;
  options: Option[];
  placeholder: string;
  required?: boolean;
  onChange?: () => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-destructive">
            {' '}
            *
          </span>
        ) : null}
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
              onBlur={field.onBlur}
              value={String(field.value ?? '')}
              aria-required={required}
              aria-invalid={fieldState.invalid}
              className="w-full"
              onChange={(event) => {
                field.onChange(event);
                onChange?.();
              }}
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

export function SlotsSection({
  control,
  rotas,
  rota,
  selectedRotaId,
  canLoadSlots,
  selectedTimes,
  onToggle,
  onRotaChange,
}: {
  control: Control<BookAppointmentFormValues>;
  rotas: DemoRota[];
  rota: DemoRota;
  selectedRotaId: string;
  canLoadSlots: boolean;
  selectedTimes: string[];
  onToggle: (time: string) => void;
  onRotaChange: (value: string) => void;
}) {
  const selected = new Set(selectedTimes);
  const { errors } = useFormState({ control, name: ['doctorRotaId', 'slotTimes'] });
  const showSlots = canLoadSlots && Boolean(selectedRotaId);

  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Clock3 className="size-4" />
          </span>
          <div>
            <CardTitle>DoctorSlots</CardTitle>
            <CardDescription>
              Choose one or more consecutive slots from the DoctorRota.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canLoadSlots ? (
          <div className="bg-muted/40 text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
            Select a Doctor and Date to load DoctorSlots.
          </div>
        ) : null}
        <Field>
          <FieldLabel htmlFor="doctor-rota">
            Doctor Rota{' '}
            <span aria-hidden="true" className="text-destructive">
              {' '}
              *
            </span>
          </FieldLabel>
          <NativeSelect
            id="doctor-rota"
            className="w-full"
            disabled={!canLoadSlots}
            aria-required="true"
            aria-invalid={Boolean(errors.doctorRotaId)}
            value={selectedRotaId}
            onChange={(event) => onRotaChange(event.target.value)}
          >
            <NativeSelectOption value="">Select Doctor Rota</NativeSelectOption>
            {rotas.map((option) => (
              <NativeSelectOption key={option.id} value={option.id}>
                {option.name} · {option.duration} min
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError errors={[errors.doctorRotaId]} />
        </Field>
        {showSlots ? (
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge tone="success">
              {rota.slots.filter((slot) => slot.status === 'Available').length} available
            </BookingStatusBadge>
            <BookingStatusBadge tone="selected">{selectedTimes.length} selected</BookingStatusBadge>
            <span className="text-muted-foreground text-xs">Booked slots remain disabled.</span>
          </div>
        ) : null}
        {showSlots ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <>
              {rota.slots.map((slot) => {
                const isSelected = selected.has(slot.time);
                const isBooked = slot.status === 'Booked';
                return (
                  <Button
                    key={slot.time}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    disabled={isBooked}
                    aria-pressed={isSelected}
                    onClick={() => onToggle(slot.time)}
                    className={cn(
                      'font-mono',
                      isBooked
                        ? 'border-warning/25 bg-warning/5 text-warning line-through disabled:opacity-100'
                        : !isSelected &&
                            'border-success/25 bg-success/5 text-success hover:bg-success/10'
                    )}
                    aria-label={isBooked ? slot.time + ' · Booked' : slot.time}
                  >
                    {slot.time}
                  </Button>
                );
              })}
            </>
          </div>
        ) : null}
        <FieldError errors={[errors.slotTimes]} />
      </CardContent>
    </Card>
  );
}
