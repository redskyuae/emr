'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AlertTriangle, Pencil, Play, Timer } from 'lucide-react';
import { toast } from 'sonner';

import type {
  PatientTreatmentPlan,
  PatientTreatmentPlanReadSession,
} from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { getApiErrors } from '@/app/queries/api-error';
import { useStartPatientTreatmentPlanSession } from '@/app/queries/patient-treatment-plans/useStartPatientTreatmentPlanSession';
import { useUpdatePatientTreatmentPlanSession } from '@/app/queries/patient-treatment-plans/useUpdatePatientTreatmentPlanSession';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

import {
  planSessionFormSchema,
  planSessionFormValues,
  planSessionUpdateRequest,
  type PlanSessionFormValues,
} from '../../_utils/plan-session-form-schema';
import { canStartPlanSession, planSessionLabel } from '../../_utils/visit-treatment-plan';
import { PlanSessionDetails } from '../plan-session-details';

type TextField = 'procedure' | 'preparation' | 'warning' | 'equipment';
type ShortField = 'roomType' | 'therapistSkill';
type MinutesField = 'durationMinutes' | 'setupMinutes' | 'cleaningMinutes';

const TEXT_FIELDS: [TextField, string][] = [
  ['procedure', 'Procedure'],
  ['preparation', 'Preparation'],
  ['warning', 'Warning'],
  ['equipment', 'Equipment'],
];
const SHORT_FIELDS: [ShortField, string][] = [
  ['roomType', 'Room type'],
  ['therapistSkill', 'Therapist Skill'],
];
const MINUTES_FIELDS: [MinutesField, string][] = [
  ['durationMinutes', 'Duration (minutes)'],
  ['setupMinutes', 'Setup (minutes)'],
  ['cleaningMinutes', 'Cleaning (minutes)'],
];

function PlanSessionForm({
  id,
  session,
  onSubmit,
}: {
  id: string;
  session: PatientTreatmentPlanReadSession;
  onSubmit: (values: PlanSessionFormValues, setRootError: (message: string) => void) => void;
}) {
  const form = useForm<PlanSessionFormValues>({
    resolver: zodResolver(planSessionFormSchema),
    mode: 'onTouched',
    defaultValues: planSessionFormValues(session),
  });
  const { errors } = form.formState;
  const submit = form.handleSubmit((values) =>
    onSubmit(values, (message) => form.setError('root', { message }))
  );

  return (
    <form
      id={id}
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {errors.root ? (
        <Alert variant="destructive">
          <AlertTitle>Could not save the Session plan</AlertTitle>
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      ) : null}
      {TEXT_FIELDS.map(([name, label]) => (
        <Field key={name} data-invalid={Boolean(errors[name])}>
          <FieldLabel htmlFor={`plan-session-${name}`}>{label}</FieldLabel>
          <Textarea
            id={`plan-session-${name}`}
            rows={name === 'procedure' ? 4 : 2}
            aria-invalid={Boolean(errors[name])}
            {...form.register(name)}
          />
          {errors[name] ? <FieldError>{errors[name].message}</FieldError> : null}
        </Field>
      ))}
      <div className="grid gap-4 sm:grid-cols-3">
        {MINUTES_FIELDS.map(([name, label]) => (
          <Field key={name} data-invalid={Boolean(errors[name])}>
            <FieldLabel htmlFor={`plan-session-${name}`}>{label}</FieldLabel>
            <Input
              id={`plan-session-${name}`}
              inputMode="numeric"
              aria-invalid={Boolean(errors[name])}
              {...form.register(name)}
            />
            {errors[name] ? <FieldError>{errors[name].message}</FieldError> : null}
          </Field>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {SHORT_FIELDS.map(([name, label]) => (
          <Field key={name} data-invalid={Boolean(errors[name])}>
            <FieldLabel htmlFor={`plan-session-${name}`}>{label}</FieldLabel>
            <Input
              id={`plan-session-${name}`}
              aria-invalid={Boolean(errors[name])}
              {...form.register(name)}
            />
            {errors[name] ? <FieldError>{errors[name].message}</FieldError> : null}
          </Field>
        ))}
      </div>
    </form>
  );
}

export function PlanSessionSheet({
  open,
  visit,
  plan,
  session,
  canUpdate,
  canStart,
  onClose,
}: {
  open: boolean;
  visit: Visit;
  plan: PatientTreatmentPlan;
  session: PatientTreatmentPlanReadSession;
  canUpdate: boolean;
  canStart: boolean;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const updateSession = useUpdatePatientTreatmentPlanSession();
  const startSession = useStartPatientTreatmentPlanSession();
  const label = planSessionLabel(session, visit);
  const pending = session.completionStatus === 'PENDING';
  // The plan is frozen once the Session is started, so it cannot change mid-treatment.
  const editable = canUpdate && pending && session.startedVisitId === null;
  const startable = canStart && canStartPlanSession(plan, session, visit);
  const busy = updateSession.isPending || startSession.isPending;
  const target = { patientId: plan.patientId, planId: plan.id, sessionId: session.id };

  async function save(values: PlanSessionFormValues, setRootError: (message: string) => void) {
    try {
      await updateSession.mutateAsync({ ...target, request: planSessionUpdateRequest(values) });
      toast.success(`Session ${session.sessionNumber} plan saved.`);
      setEditing(false);
    } catch (error) {
      setRootError(getApiErrors(error).join(' '));
    }
  }

  async function start() {
    try {
      await startSession.mutateAsync({ ...target, request: { visitId: visit.id } });
      toast.success(`Session ${session.sessionNumber} started.`);
    } catch (error) {
      toast.error(getApiErrors(error).join(' '));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(620px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle>
              Session {session.sessionNumber} of {plan.totalSessions}
            </SheetTitle>
            <Badge variant={label === 'Done' ? 'secondary' : 'outline'}>{label}</Badge>
          </div>
          <SheetDescription>
            {plan.treatmentName}
            {session.label ? ` · ${session.label}` : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {session.startedVisitId !== null && pending ? (
            <Alert>
              <Timer className="size-4" />
              <AlertTitle>
                {session.startedVisitId === visit.id
                  ? 'In progress in this Visit'
                  : 'In progress in another Visit'}
              </AlertTitle>
              <AlertDescription>
                {session.startedAt
                  ? `Started at ${new Date(session.startedAt).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}. `
                  : null}
                Completing that Visit completes this Session.
              </AlertDescription>
            </Alert>
          ) : null}

          {editing ? (
            <PlanSessionForm
              id="plan-session-form"
              session={session}
              onSubmit={(values, setRootError) => void save(values, setRootError)}
            />
          ) : (
            <>
              {session.warning ? (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription className="whitespace-pre-wrap">
                    {session.warning}
                  </AlertDescription>
                </Alert>
              ) : null}
              <PlanSessionDetails session={session} />
            </>
          )}
        </div>

        <SheetFooter className="flex-row flex-wrap justify-end gap-2 border-t p-4">
          {editing ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button type="submit" form="plan-session-form" disabled={busy}>
                {updateSession.isPending ? 'Saving…' : 'Save plan'}
              </Button>
            </>
          ) : (
            <>
              {editable ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(true)}
                  disabled={busy}
                >
                  <Pencil className="size-4" />
                  Edit plan
                </Button>
              ) : null}
              {startable ? (
                <Button type="button" onClick={() => void start()} disabled={busy}>
                  <Play className="size-4" />
                  {startSession.isPending ? 'Starting…' : 'Start Session'}
                </Button>
              ) : null}
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
