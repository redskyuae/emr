'use client';

import { ClipboardList, Info } from 'lucide-react';
import { useFormState, type Control } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookingStatusBadge } from './booking-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';
import type { DemoSession, DemoTreatment } from './book-appointment-demo-data';

export function TreatmentSessionSection({
  control,
  treatments,
  selectedTreatment,
  selectedSession,
  showSession,
  onTreatmentChange,
  onSessionChange,
}: {
  control: Control<BookAppointmentFormValues>;
  treatments: DemoTreatment[];
  selectedTreatment: DemoTreatment | null;
  selectedSession: DemoSession | null;
  showSession: boolean;
  onTreatmentChange: (value: string) => void;
  onSessionChange: (value: string) => void;
}) {
  const { errors } = useFormState({ control, name: ['treatmentId', 'sessionId'] });
  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="bg-procedure/10 text-procedure flex size-9 shrink-0 items-center justify-center rounded-lg">
            <ClipboardList className="size-4" />
          </span>
          <div>
            <CardTitle>{showSession ? 'Treatment & Session' : 'Treatment'}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <>
          {showSession && treatments.every((treatment) => treatment.availableToAssign) ? (
            <p className="text-muted-foreground text-xs">
              No assigned Treatment. Choose one below to begin.
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="treatment">
                Treatment{' '}
                <span aria-hidden="true" className="text-destructive">
                  {' '}
                  *
                </span>
              </FieldLabel>
              <NativeSelect
                id="treatment"
                className="w-full"
                aria-invalid={Boolean(errors.treatmentId)}
                value={selectedTreatment ? String(selectedTreatment.id) : ''}
                aria-required="true"
                onChange={(event) => onTreatmentChange(event.target.value)}
              >
                <NativeSelectOption value="">Select Treatment</NativeSelectOption>
                {treatments.map((treatment) => (
                  <NativeSelectOption key={treatment.id} value={String(treatment.id)}>
                    {treatment.availableToAssign ? 'Assign · ' : 'Scheduled · '}
                    {treatment.name} · {treatment.code}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.treatmentId]} />
            </Field>

            {showSession ? (
              <Field>
                <FieldLabel htmlFor="session">
                  Session{' '}
                  <span aria-hidden="true" className="text-destructive">
                    {' '}
                    *
                  </span>
                </FieldLabel>
                <NativeSelect
                  id="session"
                  className="w-full"
                  aria-invalid={Boolean(errors.sessionId)}
                  value={selectedSession?.id ?? ''}
                  disabled={!selectedTreatment}
                  aria-required="true"
                  onChange={(event) => onSessionChange(event.target.value)}
                >
                  <NativeSelectOption value="">Select Session</NativeSelectOption>
                  {(selectedTreatment?.sessions ?? []).map((session) => (
                    <NativeSelectOption key={session.id} value={session.id}>
                      {session.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError errors={[errors.sessionId]} />
              </Field>
            ) : null}
          </div>
          {selectedTreatment ? <TreatmentProgress treatment={selectedTreatment} /> : null}

          {showSession && selectedTreatment && selectedTreatment.sessions.length === 0 ? (
            <Alert className="border-warning/25 bg-warning/5">
              <Info className="size-4" />
              <AlertTitle>No Session available</AlertTitle>
              <AlertDescription>
                This Treatment is {selectedTreatment.status.toLowerCase()} or its Session setup is
                missing. Choose another Treatment or return the Patient for clinical assessment.
              </AlertDescription>
            </Alert>
          ) : null}

          {showSession && selectedSession ? <SessionDetails session={selectedSession} /> : null}
        </>
      </CardContent>
    </Card>
  );
}

function TreatmentProgress({ treatment }: { treatment: DemoTreatment }) {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
      <BookingStatusBadge tone={treatment.status === 'Expired' ? 'warning' : 'success'}>
        {treatment.availableToAssign ? 'Available to assign' : treatment.status}
      </BookingStatusBadge>
      <span>
        {treatment.completedSessions} / {treatment.plannedSessions} Sessions completed
      </span>
      <span>
        {treatment.startDate} → {treatment.endDate}
      </span>
    </div>
  );
}

function SessionDetails({ session }: { session: DemoSession }) {
  const total = session.duration + session.setupMinutes + session.cleaningMinutes;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-medium">{session.procedure}</span>
        <span className="text-muted-foreground">
          {total} min reserved · includes setup & cleaning
        </span>
      </div>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm">
            Session details · preparation & equipment
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 rounded-lg border p-3">
          <p className="text-sm">{session.preparation}</p>
          <p className="text-muted-foreground text-xs">Equipment: {session.equipment}</p>
          <p className="text-muted-foreground text-xs">
            {session.duration} min Treatment · {session.setupMinutes + session.cleaningMinutes} min
            buffer
          </p>
          <p className="text-muted-foreground text-xs">
            Room: {session.roomType} · Skill: {session.therapistSkill}
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
