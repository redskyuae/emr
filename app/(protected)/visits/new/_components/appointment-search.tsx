'use client';

import { useState } from 'react';
import { CalendarCheck, Search } from 'lucide-react';
import type { ControllerRenderProps } from 'react-hook-form';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

import { searchAppointments } from '../_utils/appointment-search';
import type { CreateVisitFormValues } from '../_utils/create-visit-form-schema';

type AppointmentField = ControllerRenderProps<CreateVisitFormValues, 'appointmentId'>;

const RESULT_LIMIT = 20;

function AppointmentSummary({ appointment }: { appointment: Appointment }) {
  const time = appointment.startTime ?? appointment.slots[0]?.slotTime;
  const clinician = appointment.doctor?.name ?? appointment.therapist?.name;

  return (
    <span className="min-w-0">
      <span className="block font-medium">
        <span className="font-mono">{appointment.bookingNumber}</span> ·{' '}
        {appointment.patient.firstName} {appointment.patient.lastName}
      </span>
      <span className="text-muted-foreground block text-xs">
        <span className="font-mono">{appointment.patient.mrn}</span>
        {` · ${appointment.slotDate}`}
        {time ? ` ${time}` : ''}
        {clinician ? ` · ${clinician}` : ''}
      </span>
    </span>
  );
}

export function AppointmentSearch({
  field,
  error,
  appointments,
  disabled,
  onSelect,
}: {
  field: AppointmentField;
  error?: string;
  appointments: Appointment[];
  disabled: boolean;
  onSelect: (appointmentId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const selected = appointments.find((appointment) => String(appointment.id) === field.value);
  const matches = searchAppointments(appointments, search);
  const results = matches.slice(0, RESULT_LIMIT);
  const showResults = Boolean(search.trim()) || !selected;

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="visit-appointment-search">
        Appointment{' '}
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      </FieldLabel>
      <InputGroup className="w-full">
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          id="visit-appointment-search"
          type="search"
          value={search}
          disabled={disabled}
          onChange={(event) => setSearch(event.target.value)}
          onBlur={field.onBlur}
          placeholder="Search by booking number, Patient name, MRN, phone, or Doctor"
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-controls="visit-appointment-results"
          autoComplete="off"
        />
      </InputGroup>
      <FieldError>{error}</FieldError>

      {selected ? (
        <div className="border-primary/30 bg-primary/5 flex items-center gap-3 rounded-lg border p-3">
          <CalendarCheck className="text-primary size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <AppointmentSummary appointment={selected} />
          </div>
          <span className="text-primary text-xs font-medium">Selected</span>
        </div>
      ) : null}

      {showResults ? (
        <div
          id="visit-appointment-results"
          className="max-h-72 space-y-1 overflow-y-auto rounded-lg border p-1"
          aria-live="polite"
        >
          {results.length ? (
            <>
              {results.map((appointment) => (
                <Button
                  key={appointment.id}
                  type="button"
                  variant="ghost"
                  disabled={disabled}
                  aria-pressed={appointment.id === selected?.id}
                  className="h-auto w-full justify-start gap-3 px-3 py-2 text-left whitespace-normal"
                  onClick={() => {
                    onSelect(String(appointment.id));
                    setSearch('');
                  }}
                >
                  <CalendarCheck className="text-muted-foreground size-4 shrink-0" />
                  <AppointmentSummary appointment={appointment} />
                  <Badge variant="secondary" className="ml-auto shrink-0">
                    {appointment.appointmentStatus.name}
                  </Badge>
                </Button>
              ))}
              {matches.length > results.length ? (
                <p className="text-muted-foreground px-3 py-2 text-xs">
                  More Appointments match. Enter more details to narrow the search.
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground p-3 text-sm">
              {appointments.length
                ? 'No Appointments match this search.'
                : 'No Scheduled or Confirmed Appointments to check in.'}
            </p>
          )}
        </div>
      ) : null}
    </Field>
  );
}
