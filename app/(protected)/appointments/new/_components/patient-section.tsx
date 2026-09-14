'use client';

import { Check, LoaderCircle, RefreshCw, Search, UserRound } from 'lucide-react';
import { Controller, useFormState, type Control } from 'react-hook-form';

import { BookingStatusBadge } from './booking-status-badge';
import { PatientVisitHistory } from './patient-visit-history';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';
import type { BookablePatient } from '../_utils/book-appointment-types';

export function PatientSection({
  control,
  patientMode,
  patients,
  search,
  onPatientModeChange,
  onSearchChange,
  selectedPatient,
  onSelectPatient,
  visits,
  isSearchLoading,
  searchError,
  onRetrySearch,
  isVisitsLoading,
  visitsError,
  onRetryVisits,
}: {
  control: Control<BookAppointmentFormValues>;
  patientMode: BookAppointmentFormValues['patientMode'];
  patients: BookablePatient[];
  search: string;
  onPatientModeChange: (mode: BookAppointmentFormValues['patientMode']) => void;
  onSearchChange: (value: string) => void;
  selectedPatient: BookablePatient | null;
  onSelectPatient: (patient: BookablePatient) => void;
  visits: Visit[];
  isSearchLoading: boolean;
  searchError: string | null;
  onRetrySearch: () => void;
  isVisitsLoading: boolean;
  visitsError: string | null;
  onRetryVisits: () => void;
}) {
  const { errors } = useFormState({
    control,
    name: ['patientId', 'firstName', 'lastName', 'phone', 'email'],
  });
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
              Select an existing Patient or capture the minimum details for a Provisional Patient.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs
          value={patientMode}
          onValueChange={(value) => {
            if (value === 'existing' || value === 'provisional') onPatientModeChange(value);
          }}
        >
          <TabsList className="w-full">
            <TabsTrigger value="existing" className="flex-1">
              Existing Patient
            </TabsTrigger>
            <TabsTrigger value="provisional" className="flex-1">
              Provisional Patient
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3 pt-4">
            {showResults ? (
              <Field>
                <FieldLabel htmlFor="patient-search">
                  Search Patient{' '}
                  <span aria-hidden="true" className="text-destructive">
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
            {showResults && search.trim().length > 0 ? (
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
                          'Registered'
                        )}
                      </Badge>
                    </Button>
                  ))
                ) : isSearchLoading ? (
                  <div className="text-muted-foreground flex items-center gap-2 rounded-lg border p-3 text-sm">
                    <LoaderCircle className="size-4 animate-spin" /> Loading Registered Patients…
                  </div>
                ) : searchError ? (
                  <div className="border-destructive/25 bg-destructive/5 rounded-lg border p-3 text-sm">
                    <p>{searchError}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={onRetrySearch}
                    >
                      <RefreshCw className="size-3.5" /> Retry
                    </Button>
                  </div>
                ) : (
                  <div className="bg-muted/40 text-muted-foreground rounded-lg border p-4 text-sm">
                    No active Patients match this search.
                  </div>
                )}
              </div>
            ) : null}
            {selectedPatient ? (
              <IdentityCard
                patient={selectedPatient}
                visits={visits}
                isVisitsLoading={isVisitsLoading}
                visitsError={visitsError}
                onRetryVisits={onRetryVisits}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="provisional" className="space-y-4 pt-4">
            <p className="text-muted-foreground text-sm">
              Capture these required details to book a Provisional Patient. Full registration can be
              completed later.
            </p>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="firstName"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.firstName)}>
                    <FieldLabel htmlFor="provisional-patient-first-name">
                      First name{' '}
                      <span aria-hidden="true" className="text-destructive">
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="provisional-patient-first-name"
                      aria-required="true"
                      aria-invalid={Boolean(errors.firstName)}
                      autoComplete="given-name"
                    />
                    <FieldError errors={[errors.firstName]} />
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="lastName"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.lastName)}>
                    <FieldLabel htmlFor="provisional-patient-last-name">
                      Last name{' '}
                      <span aria-hidden="true" className="text-destructive">
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="provisional-patient-last-name"
                      aria-required="true"
                      aria-invalid={Boolean(errors.lastName)}
                      autoComplete="family-name"
                    />
                    <FieldError errors={[errors.lastName]} />
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.phone)}>
                    <FieldLabel htmlFor="provisional-patient-phone">
                      Phone number{' '}
                      <span aria-hidden="true" className="text-destructive">
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="provisional-patient-phone"
                      aria-required="true"
                      aria-invalid={Boolean(errors.phone)}
                      autoComplete="tel"
                      inputMode="tel"
                    />
                    <FieldError errors={[errors.phone]} />
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.email)}>
                    <FieldLabel htmlFor="provisional-patient-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="provisional-patient-email"
                      aria-invalid={Boolean(errors.email)}
                      autoComplete="email"
                      inputMode="email"
                      type="email"
                    />
                    <FieldError errors={[errors.email]} />
                  </Field>
                )}
              />

            </FieldGroup>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function IdentityCard({
  patient,
  visits,
  isVisitsLoading,
  visitsError,
  onRetryVisits,
}: {
  patient: BookablePatient;
  visits: Visit[];
  isVisitsLoading: boolean;
  visitsError: string | null;
  onRetryVisits: () => void;
}) {
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
        <IdentityItem label="Emirates ID" value={patient.emiratesId ?? 'Not recorded'} mono />
        <IdentityItem label="Registration" value="Registered" />
      </div>
      <PatientVisitHistory
        visits={visits}
        isLoading={isVisitsLoading}
        error={visitsError}
        onRetry={onRetryVisits}
      />
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
