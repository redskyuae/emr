'use client';

import { useState } from 'react';
import { ClipboardList, Info, RefreshCw, TriangleAlert } from 'lucide-react';
import {
  Controller,
  useFormState,
  type Control,
  type FieldError as FormFieldError,
} from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';
import type {
  BookingSession,
  BookingTreatment,
  TreatmentSelectionState,
} from './book-appointment-demo-data';
import { BookingStatusBadge } from './booking-status-badge';

type TreatmentSectionState = TreatmentSelectionState | 'AWAITING_PATIENT';

export function TreatmentSessionSection({
  control,
  patient,
  state,
  plans,
  treatments,
  selectedTreatment,
  selectedSession,
  treatmentSearch,
  isTreatmentsLoading,
  plansError,
  treatmentsError,
  onPlanChange,
  onTreatmentChange,
  onTreatmentSearchChange,
  onSessionChange,
  onRetryPlans,
  onRetryTreatments,
}: {
  control: Control<BookAppointmentFormValues>;
  patient: { name: string; mrn: string } | null;
  state: TreatmentSectionState;
  plans: BookingTreatment[];
  treatments: BookingTreatment[];
  selectedTreatment: BookingTreatment | null;
  selectedSession: BookingSession | null;
  treatmentSearch: string;
  isTreatmentsLoading: boolean;
  plansError: string | null;
  treatmentsError: string | null;
  onPlanChange: (value: string) => void;
  onTreatmentChange: (value: string) => void;
  onTreatmentSearchChange: (value: string) => void;
  onSessionChange: (value: string) => void;
  onRetryPlans: () => void;
  onRetryTreatments: () => void;
}) {
  const { errors } = useFormState({
    control,
    name: [
      'selectionMode',
      'patientTreatmentPlanId',
      'patientTreatmentPlanSessionId',
      'treatmentId',
      'totalSessions',
    ],
  });
  const selectedDurationUnknown =
    selectedSession !== null &&
    (selectedSession.duration === null ||
      selectedSession.setupMinutes === null ||
      selectedSession.cleaningMinutes === null);

  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="bg-procedure/10 text-procedure flex size-9 shrink-0 items-center justify-center rounded-lg">
            <ClipboardList className="size-4" />
          </span>
          <div>
            <CardTitle>Treatment & Session</CardTitle>
            <p className="text-muted-foreground mt-1 text-xs">
              {patient
                ? `Current Treatment Plans for ${patient.name} · ${patient.mrn}`
                : 'Select a Registered Patient to load their current Treatment Plans.'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {plansError ? (
          <LoadError
            message={plansError}
            subject="Patient Treatment Plans"
            onRetry={onRetryPlans}
          />
        ) : state === 'AWAITING_PATIENT' ? (
          <p className="text-muted-foreground text-sm">
            Select a Registered Patient to load their current Treatment Plans.
          </p>
        ) : state === 'LOADING' ? (
          <PlanLoadingSkeleton />
        ) : state === 'PLANS' || state === 'CONFLICT' ? (
          <PlanSelection
            plans={plans}
            selectedTreatment={selectedTreatment}
            selectedSession={selectedSession}
            onPlanChange={onPlanChange}
            onSessionChange={onSessionChange}
            showAllSessions={state === 'CONFLICT'}
            planError={errors.patientTreatmentPlanId}
            sessionError={errors.patientTreatmentPlanSessionId}
          />
        ) : state === 'CATALOGUE_FORBIDDEN' ? (
          <Alert className="border-warning/25 bg-warning/5">
            <TriangleAlert className="text-warning size-4" />
            <AlertTitle>No Current Treatment Plan</AlertTitle>
            <AlertDescription>
              You do not have permission to assign a catalogue Treatment to this Patient.
            </AlertDescription>
          </Alert>
        ) : (
          <CatalogueSelection
            control={control}
            treatments={treatments}
            selectedTreatment={selectedTreatment}
            selectedSession={selectedSession}
            search={treatmentSearch}
            isLoading={isTreatmentsLoading}
            error={treatmentsError}
            treatmentError={errors.treatmentId}
            onTreatmentChange={onTreatmentChange}
            onSearchChange={onTreatmentSearchChange}
            onRetry={onRetryTreatments}
          />
        )}

        {state === 'CONFLICT' ? (
          <Alert className="border-warning/25 bg-warning/5">
            <TriangleAlert className="text-warning size-4" />
            <AlertTitle>No Bookable Session</AlertTitle>
            <AlertDescription>
              This Patient has a current Treatment Plan, but every Session is completed or reserved
              by another Appointment. Catalogue assignment is unavailable while a current Plan
              exists.
            </AlertDescription>
          </Alert>
        ) : null}

        {state === 'PLANS' && selectedTreatment && !selectedSession ? (
          <Alert className="border-warning/25 bg-warning/5">
            <Info className="size-4" />
            <AlertTitle>No Bookable Session In This Plan</AlertTitle>
            <AlertDescription>
              Choose another current Plan. Completed and reserved Sessions remain visible for
              context.
            </AlertDescription>
          </Alert>
        ) : null}

        {state === 'PLANS' && selectedDurationUnknown ? (
          <Alert className="border-warning/25 bg-warning/5">
            <Info className="size-4" />
            <AlertTitle>Session Duration Not Configured</AlertTitle>
            <AlertDescription>
              Enter the Procedure end time manually. Choose the Room from the available Room list.
            </AlertDescription>
          </Alert>
        ) : null}

        <FieldError errors={[errors.selectionMode]} />
      </CardContent>
    </Card>
  );
}

function PlanSelection({
  plans,
  selectedTreatment,
  selectedSession,
  onPlanChange,
  onSessionChange,
  showAllSessions,
  planError,
  sessionError,
}: {
  plans: BookingTreatment[];
  selectedTreatment: BookingTreatment | null;
  selectedSession: BookingSession | null;
  onPlanChange: (value: string) => void;
  onSessionChange: (value: string) => void;
  showAllSessions: boolean;
  planError?: FormFieldError;
  sessionError?: FormFieldError;
}) {
  const [inspectedSessionId, setInspectedSessionId] = useState<string | null>(null);
  const inspectedSession = plans
    .flatMap((plan) => plan.sessions)
    .find((session) => session.id === inspectedSessionId);
  const sessionForDetails = inspectedSession ?? selectedSession;

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel htmlFor="patient-treatment-plan">
          Treatment <RequiredMark />
        </FieldLabel>
        <NativeSelect
          id="patient-treatment-plan"
          className="w-full"
          value={selectedTreatment ? String(selectedTreatment.patientTreatmentPlanId) : ''}
          aria-invalid={Boolean(planError)}
          aria-required="true"
          onChange={(event) => {
            setInspectedSessionId(null);
            onPlanChange(event.target.value);
          }}
        >
          <NativeSelectOption value="">Select Treatment</NativeSelectOption>
          {plans.map((plan) => (
            <NativeSelectOption key={plan.id} value={String(plan.patientTreatmentPlanId)}>
              {plan.name} · {plan.code} · {plan.completedSessions}/{plan.plannedSessions} completed
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldError errors={[planError]} />
      </Field>

      {(selectedTreatment ? [selectedTreatment] : plans).map((plan) => (
        <div key={plan.id} className="space-y-3 rounded-lg border p-3">
          <TreatmentProgress treatment={plan} />
          {selectedTreatment || plans.length === 1 || showAllSessions ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {plan.sessions.map((session) => (
                <Button
                  key={session.id}
                  type="button"
                  variant="outline"
                  aria-pressed={sessionForDetails?.id === session.id}
                  aria-label={
                    session.isBookable
                      ? `Select ${session.label}`
                      : `View details for ${session.label}, ${session.unavailableReason}`
                  }
                  onClick={() => {
                    setInspectedSessionId(session.id);
                    if (session.isBookable) onSessionChange(session.id);
                  }}
                  className={cn(
                    'flex h-auto min-h-14 w-full min-w-0 flex-col items-start gap-2 px-3 py-2 text-left whitespace-normal',
                    sessionForDetails?.id === session.id &&
                      'border-primary bg-primary/5 ring-primary/15 ring-2'
                  )}
                >
                  <span className="w-full min-w-0">
                    <span className="block truncate font-medium">{session.label}</span>
                    <span className="text-muted-foreground mt-1 block truncate text-xs">
                      {session.procedure}
                    </span>
                    {session.reservedAppointment ? (
                      <span className="text-warning mt-1 block text-xs leading-snug font-medium break-words">
                        Booked: {formatBookedSessionDate(session.reservedAppointment.slotDate)} ·{' '}
                        {session.reservedAppointment.startTime ?? 'Time not recorded'}–
                        {session.reservedAppointment.endTime ?? 'Time not recorded'}
                      </span>
                    ) : session.unavailableReason === 'Completed' && session.completedAt ? (
                      <span className="text-muted-foreground mt-1 block text-xs leading-snug font-medium break-words">
                        Completed: {formatCompletedSessionDateTime(session.completedAt)}
                      </span>
                    ) : null}
                  </span>
                  <span className="self-start">
                    <BookingStatusBadge
                      tone={
                        session.isBookable
                          ? selectedSession?.id === session.id
                            ? 'selected'
                            : 'success'
                          : session.unavailableReason === 'Completed'
                            ? 'neutral'
                            : 'warning'
                      }
                    >
                      {session.isBookable
                        ? sessionForDetails?.id === session.id
                          ? 'Selected'
                          : 'Available'
                        : session.unavailableReason}
                    </BookingStatusBadge>
                  </span>
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ))}
      <FieldError errors={[sessionError]} />
      {sessionForDetails ? <SessionDetails session={sessionForDetails} /> : null}
    </div>
  );
}

function CatalogueSelection({
  control,
  treatments,
  selectedTreatment,
  selectedSession,
  search,
  isLoading,
  error,
  treatmentError,
  onTreatmentChange,
  onSearchChange,
  onRetry,
}: {
  control: Control<BookAppointmentFormValues>;
  treatments: BookingTreatment[];
  selectedTreatment: BookingTreatment | null;
  selectedSession: BookingSession | null;
  search: string;
  isLoading: boolean;
  error: string | null;
  treatmentError?: FormFieldError;
  onTreatmentChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onRetry: () => void;
}) {
  if (error) return <LoadError message={error} subject="Treatments" onRetry={onRetry} />;

  const durationUnknown =
    selectedSession !== null &&
    (selectedSession.duration === null ||
      selectedSession.setupMinutes === null ||
      selectedSession.cleaningMinutes === null);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        No current Patient Treatment Plan. Search the catalogue to assign one while booking.
      </p>
      <Field>
        <FieldLabel htmlFor="treatment-catalogue">
          Treatment <RequiredMark />
        </FieldLabel>
        <Combobox<BookingTreatment>
          items={treatments}
          value={selectedTreatment}
          itemToStringValue={(item) => `${item.name} · ${item.code}`}
          onValueChange={(item) => onTreatmentChange(item ? String(item.treatmentId) : '')}
          onInputValueChange={onSearchChange}
        >
          <ComboboxInput
            id="treatment-catalogue"
            className="w-full"
            placeholder="Search Treatment name or code"
            aria-invalid={Boolean(treatmentError)}
            aria-required="true"
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>
              {isLoading ? 'Searching Treatments…' : 'No Treatments found.'}
            </ComboboxEmpty>
            <ComboboxList>
              {treatments.map((treatment) => (
                <ComboboxItem key={treatment.id} value={treatment}>
                  <span>
                    <span className="block font-medium">{treatment.name}</span>
                    <span className="text-muted-foreground block font-mono text-xs">
                      {treatment.code}
                    </span>
                  </span>
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <p className="text-muted-foreground text-xs" aria-live="polite">
          {isLoading
            ? `Searching${search ? ` for “${search}”` : ''}…`
            : 'Showing up to 20 matching Treatments.'}
        </p>
        <FieldError errors={[treatmentError]} />
      </Field>

      {selectedTreatment?.sessionStructure === 'REPEATABLE' ? (
        <Controller
          control={control}
          name="totalSessions"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="total-sessions">
                Total Sessions <RequiredMark />
              </FieldLabel>
              <Input
                {...field}
                id="total-sessions"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                aria-required="true"
                aria-invalid={fieldState.invalid}
              />
              <p className="text-muted-foreground text-xs">
                Repeatable Treatments use the same Session template for the prescribed count.
              </p>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      ) : selectedTreatment ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <BookingStatusBadge tone="neutral">Sequenced</BookingStatusBadge>
          <span className="text-muted-foreground">
            {selectedTreatment.plannedSessions} fixed Sessions
          </span>
        </div>
      ) : null}

      {durationUnknown ? (
        <Alert className="border-warning/25 bg-warning/5">
          <Info className="size-4" />
          <AlertTitle>Session Duration Not Configured</AlertTitle>
          <AlertDescription>
            Enter the Procedure end time manually. Choose the Room from the available Room list.
          </AlertDescription>
        </Alert>
      ) : null}

      {selectedSession ? <SessionDetails session={selectedSession} /> : null}
    </div>
  );
}

function TreatmentProgress({ treatment }: { treatment: BookingTreatment }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="font-medium">
          {treatment.name} <span className="font-mono text-xs">{treatment.code}</span>
        </p>
        <p className="text-muted-foreground text-xs">
          {treatment.completedSessions} of {treatment.plannedSessions} Sessions completed
        </p>
      </div>
      <BookingStatusBadge
        tone={
          treatment.status === 'Stopped'
            ? 'danger'
            : treatment.status === 'Completed'
              ? 'neutral'
              : 'success'
        }
      >
        {treatment.status}
      </BookingStatusBadge>
    </div>
  );
}

function SessionDetails({ session }: { session: BookingSession }) {
  const buffer =
    session.setupMinutes === null || session.cleaningMinutes === null
      ? null
      : session.setupMinutes + session.cleaningMinutes;
  const total = session.duration === null || buffer === null ? null : session.duration + buffer;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="min-w-0 font-medium break-words">{session.procedure}</span>
        <span className="flex flex-wrap items-center gap-2">
          {!session.isBookable ? (
            <BookingStatusBadge
              tone={session.unavailableReason === 'Completed' ? 'neutral' : 'warning'}
            >
              {session.unavailableReason}
            </BookingStatusBadge>
          ) : null}
          <span className="text-muted-foreground">
            {total === null
              ? 'Duration not configured'
              : `${total} min reserved · includes setup & cleaning`}
          </span>
        </span>
      </div>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm">
            Session details · preparation & equipment
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 rounded-lg border p-3">
          <p className="text-sm">{session.preparation || 'No preparation recorded.'}</p>
          <p className="text-muted-foreground text-xs">
            Equipment: {session.equipment || 'Not recorded'}
          </p>
          <p className="text-muted-foreground text-xs">
            {session.duration === null
              ? 'Duration not configured'
              : `${session.duration} min Treatment`}
            {' · '}
            {buffer === null ? 'Buffer not configured' : `${buffer} min buffer`}
          </p>
          <p className="text-muted-foreground text-xs">
            Room: {session.roomType || 'Not recorded'} · Skill:{' '}
            {session.therapistSkill || 'Not recorded'}
          </p>
          {session.reservedAppointment ? (
            <p className="text-muted-foreground text-xs">
              Booked Appointment:{' '}
              <span className="font-mono">{session.reservedAppointment.bookingNumber}</span> ·{' '}
              {formatBookedSessionDate(session.reservedAppointment.slotDate)} ·{' '}
              {session.reservedAppointment.startTime ?? 'Time not recorded'}–
              {session.reservedAppointment.endTime ?? 'Time not recorded'}
            </p>
          ) : session.unavailableReason === 'Completed' && session.completedAt ? (
            <p className="text-muted-foreground text-xs">
              Completed: {formatCompletedSessionDateTime(session.completedAt)}
            </p>
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function formatBookedSessionDate(slotDate: string) {
  const [year, month, day] = slotDate.split('-');
  return year && month && day ? `${day}-${month}-${year}` : slotDate;
}

function formatCompletedSessionDateTime(completedAt: Date | string) {
  const date = new Date(completedAt);
  if (Number.isNaN(date.getTime())) return 'Date and time not recorded';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(',', ' ·');
}

function LoadError({
  message,
  subject,
  onRetry,
}: {
  message: string;
  subject: string;
  onRetry: () => void;
}) {
  return (
    <Alert variant="destructive" role="alert">
      <TriangleAlert className="size-4" />
      <AlertTitle>{subject} Could Not Be Loaded</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
        <span>{message}</span>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5" /> Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function PlanLoadingSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading Patient Treatment Plans">
      <Skeleton className="h-4 w-56" />
      <div className="space-y-3 rounded-lg border p-3">
        <div className="flex justify-between gap-4">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      *
    </span>
  );
}
