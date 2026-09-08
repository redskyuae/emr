'use client';

import { Check, Search, UserRound, UserRoundPlus } from 'lucide-react';
import { Controller, useFormState, type Control } from 'react-hook-form';

import { BookingStatusBadge } from './booking-status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';
import type { DemoPatient } from './book-appointment-demo-data';

export function PatientSection({
  control,
  patients,
  search,
  onSearchChange,
  selectedPatient,
  onSelectPatient,
  patientMode,
  onPatientModeChange,
}: {
  control: Control<BookAppointmentFormValues>;
  patients: DemoPatient[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedPatient: DemoPatient | null;
  onSelectPatient: (patient: DemoPatient) => void;
  patientMode: BookAppointmentFormValues['patientMode'];
  onPatientModeChange: (mode: BookAppointmentFormValues['patientMode']) => void;
}) {
  const { errors } = useFormState({ control, name: 'patientId' });
  const showResults =
    !selectedPatient || search !== selectedPatient.firstName + ' ' + selectedPatient.lastName;
  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <UserRound className="size-4" />
          </span>
          <div>
            <CardTitle>Patient</CardTitle>
            <CardDescription>
              Find the patient and verify their identity before booking.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            aria-pressed={patientMode === 'existing'}
            onClick={() => onPatientModeChange('existing')}
            className={cn(
              'justify-start',
              patientMode === 'existing' && 'border-primary bg-primary/5 text-primary'
            )}
          >
            <UserRound className="size-4" /> Existing Patient
          </Button>
          <Button
            type="button"
            variant="outline"
            aria-pressed={patientMode === 'provisional'}
            onClick={() => onPatientModeChange('provisional')}
            className={cn(
              'justify-start',
              patientMode === 'provisional' && 'border-primary bg-primary/5 text-primary'
            )}
          >
            <UserRoundPlus className="size-4" /> Provisional Patient
          </Button>
        </div>

        {patientMode === 'existing' ? (
          <>
            {showResults ? (
              <Field>
                <FieldLabel htmlFor="patient-search">
                  Search Patient{' '}
                  <span aria-hidden="true" className="text-destructive">
                    {' '}
                    *
                  </span>
                </FieldLabel>
                <InputGroup className="bg-background shadow-fluent-2">
                  <InputGroupAddon>
                    <Search className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    aria-required="true"
                    aria-invalid={Boolean(errors.patientId)}
                    id="patient-search"
                    value={search}
                    placeholder="Search by name, phone, or MRN"
                    onChange={(event) => onSearchChange(event.target.value)}
                  />
                </InputGroup>
                <FieldError errors={[errors.patientId]} />
              </Field>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">Selected Patient</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => onSearchChange('')}>
                  Change Patient
                </Button>
              </div>
            )}
            {showResults ? (
              <div className="grid max-h-72 gap-2 overflow-y-auto">
                {patients.length > 0 ? (
                  patients.map((patient) => (
                    <Button
                      variant="outline"
                      key={patient.id}
                      type="button"
                      onClick={() => onSelectPatient(patient)}
                      className={cn(
                        'focus-visible:ring-ring flex h-auto w-full items-center gap-3 rounded-lg border p-2 text-left whitespace-normal outline-none focus-visible:ring-2',
                        selectedPatient?.id === patient.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:bg-accent'
                      )}
                    >
                      <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <UserRound className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          {patient.firstName} {patient.lastName}
                        </span>
                        <span className="text-muted-foreground block text-xs">
                          {patient.mrn} · {patient.phone}
                        </span>
                      </span>
                      <Badge variant={selectedPatient?.id === patient.id ? 'default' : 'secondary'}>
                        {selectedPatient?.id === patient.id ? (
                          <>
                            <Check className="size-3" /> Selected
                          </>
                        ) : (
                          patient.registrationStatus
                        )}
                      </Badge>
                    </Button>
                  ))
                ) : (
                  <div className="bg-muted/40 text-muted-foreground rounded-lg border p-4 text-sm">
                    No active Patients match this search.
                  </div>
                )}
              </div>
            ) : null}
            {selectedPatient ? <IdentityCard patient={selectedPatient} /> : null}
          </>
        ) : (
          <ProvisionalPatientFields control={control} />
        )}
      </CardContent>
    </Card>
  );
}

function ProvisionalPatientFields({ control }: { control: Control<BookAppointmentFormValues> }) {
  return (
    <div className="space-y-3">
      <div className="bg-muted/40 text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
        Book before full Patient Registration. Complete registration before check-in.
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ProvisionalField control={control} name="firstName" label="First name" required />
        <ProvisionalField control={control} name="lastName" label="Last name" required />
        <ProvisionalField control={control} name="phone" label="Phone" required />
        <ProvisionalField control={control} name="email" label="Email" />
      </div>
    </div>
  );
}

function ProvisionalField({
  control,
  name,
  label,
  required,
}: {
  control: Control<BookAppointmentFormValues>;
  name: 'firstName' | 'lastName' | 'phone' | 'email';
  label: string;
  required?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor={`provisional-${name}`}>
            {label}
            {required ? (
              <span aria-hidden="true" className="text-destructive">
                {' '}
                *
              </span>
            ) : null}
          </FieldLabel>
          <Input
            id={`provisional-${name}`}
            type={name === 'email' ? 'email' : 'text'}
            {...field}
            aria-required={required}
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

function IdentityCard({ patient }: { patient: DemoPatient }) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">
          {patient.firstName} {patient.lastName}
        </p>
        <BookingStatusBadge tone="selected">Selected</BookingStatusBadge>
      </div>
      <div className="bg-muted/35 grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
        <IdentityItem label="MRN" value={patient.mrn} mono />
        <IdentityItem label="Phone" value={patient.phone} />
        <IdentityItem label="Emirates ID" value={patient.emiratesId} mono />
        <IdentityItem label="Registration" value={patient.registrationStatus} />
      </div>
      {patient.duplicateWarning ? (
        <Alert className="border-success/25 bg-success/5">
          <Check className="text-success size-4" />
          <AlertTitle className="text-success">Identity check passed</AlertTitle>
          <AlertDescription>{patient.duplicateWarning}</AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}

function IdentityItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <p className={cn('text-sm font-medium break-words', mono && 'font-mono text-xs')}>{value}</p>
    </div>
  );
}
