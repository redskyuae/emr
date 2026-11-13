import { useState, type ReactNode } from 'react';
import type { Control, FieldErrors, UseFormResetField, UseFormSetValue } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import {
  ClipboardList,
  Lock,
  Plus,
  RefreshCcw,
  Sparkles,
  Stethoscope,
  UserRound,
} from 'lucide-react';

import type { AdmitSource } from '@/app/api/lib/modules/admit-source/schemas/admit-source-schema';
import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { Doctor } from '@/app/api/lib/modules/doctor/schemas/doctor-schema';
import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';
import type { VisitPatientTypeAssessment } from '@/app/api/lib/modules/visit/schemas/visit-patient-type';
import { RichTextEditor } from '@/components/clinical/rich-text-editor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { CreateVisitFormValues } from '../_utils/create-visit-form-schema';
import { getAppointmentVisitDefaults } from '../_utils/appointment-visit-defaults';
import { AppointmentSearch } from './appointment-search';
import { SectionHeading } from './section-heading';
import { WalkInPatientSearch } from './walk-in-patient-search';

const CHIEF_COMPLAINT_LIMIT = 500;

type FormProps = {
  control: Control<CreateVisitFormValues>;
  errors: FieldErrors<CreateVisitFormValues>;
  setValue: UseFormSetValue<CreateVisitFormValues>;
  resetField: UseFormResetField<CreateVisitFormValues>;
  appointments: Appointment[];
  selectedPatient: Patient | null;
  doctors: Doctor[];
  visitTypes: VisitType[];
  admitSources: AdmitSource[];
  loading: boolean;
  historyError?: boolean;
  recentDoctorVisit?: { visitDate: string; visitNumber: string } | null;
  patientType?: VisitPatientTypeAssessment | null;
  patientTypeLoading?: boolean;
  patientTypeError?: boolean;
  onRetryPatientType?: () => void;
};

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      {' '}
      *
    </span>
  );
}

export function VisitSourceFields({
  control,
  errors,
  setValue,
  resetField,
  appointments,
  selectedPatient,
  visitTypes,
  loading,
  children,
}: FormProps & { children?: ReactNode }) {
  const mode = useWatch({ control, name: 'mode' });
  function replaceField(
    name:
      | 'appointmentId'
      | 'patientId'
      | 'doctorId'
      | 'visitTypeId'
      | 'admitSourceId'
      | 'chiefComplaint'
      | 'remarks',
    value: string
  ) {
    resetField(name, { defaultValue: value });
    // Visit detail fields may not be mounted yet. Keep their values in form
    // state even when resetField has no registered input to update.
    setValue(name, value);
  }

  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading
          id="check-in-patient-heading"
          icon={<UserRound className="size-5" />}
          title="Confirm the Patient"
          description="Find today's Appointment or a Walk-in Patient."
        />
        <Tabs
          value={mode}
          onValueChange={(value) => {
            setValue('mode', value as CreateVisitFormValues['mode']);
            replaceField('appointmentId', '');
            replaceField('patientId', '');
            replaceField('doctorId', '');
            replaceField('visitTypeId', '');
            replaceField('admitSourceId', '');
            replaceField('chiefComplaint', '');
            replaceField('remarks', '');
          }}
        >
          <TabsList className="grid w-full grid-cols-2 sm:w-72">
            <TabsTrigger value="appointment">From Appointment</TabsTrigger>
            <TabsTrigger value="walk-in">Walk-in</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === 'appointment' ? (
          <Controller
            control={control}
            name="appointmentId"
            render={({ field }) => (
              <AppointmentSearch
                field={field}
                error={errors.appointmentId?.message}
                appointments={appointments}
                disabled={loading}
                onSelect={(appointmentId) => {
                  field.onChange(appointmentId);
                  const selected = appointments.find(
                    (appointment) => String(appointment.id) === appointmentId
                  );
                  const defaults = getAppointmentVisitDefaults(selected, visitTypes);
                  replaceField('visitTypeId', defaults.visitTypeId);
                  replaceField('admitSourceId', '');
                  replaceField('chiefComplaint', defaults.chiefComplaint);
                  replaceField('remarks', defaults.remarks);
                  replaceField('doctorId', '');
                }}
              />
            )}
          />
        ) : (
          <Controller
            control={control}
            name="patientId"
            render={({ field }) => (
              <WalkInPatientSearch
                field={field}
                error={errors.patientId?.message}
                selectedPatient={selectedPatient}
                onSelect={(patientId) => {
                  field.onChange(patientId);
                  replaceField('visitTypeId', '');
                  replaceField('admitSourceId', '');
                  replaceField('chiefComplaint', '');
                  replaceField('remarks', '');
                }}
              />
            )}
          />
        )}
        {children}
      </CardContent>
    </Card>
  );
}

function PatientTypeBadge({
  patientType,
  loading,
  error,
  onRetry,
}: {
  patientType?: VisitPatientTypeAssessment | null;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  if (loading) {
    return <Skeleton className="h-6 w-36" aria-label="Checking completed Visit history" />;
  }
  if (error) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        <RefreshCcw className="size-4" />
        Retry Patient type
      </Button>
    );
  }
  if (!patientType) return null;

  return (
    <Badge variant="secondary" className="bg-accent text-primary h-7 px-3">
      {patientType.patientType === 'ESTABLISHED' ? 'Established Patient' : 'New Patient'}
    </Badge>
  );
}

function patientTypeDescription(patientType?: VisitPatientTypeAssessment | null) {
  if (!patientType) return 'Prefilled from the Appointment and Visit history.';
  return patientType.lastCompletedVisit
    ? `Last completed Visit ${patientType.lastCompletedVisit.visitNumber} on ${patientType.lastCompletedVisit.visitDate}.`
    : `Patient record opened ${patientType.patientRecordDate}. No completed Visit in the past three years.`;
}

export function VisitDetailsFields({
  control,
  errors,
  doctors,
  visitTypes,
  admitSources,
  loading,
  appointments,
  historyError,
  recentDoctorVisit,
  patientType,
  patientTypeLoading,
  patientTypeError,
  onRetryPatientType,
}: FormProps) {
  const mode = useWatch({ control, name: 'mode' });
  const appointmentId = useWatch({ control, name: 'appointmentId' });
  const visitTypeId = useWatch({ control, name: 'visitTypeId' });
  const chiefComplaint = useWatch({ control, name: 'chiefComplaint' });
  const remarks = useWatch({ control, name: 'remarks' });
  const [remarksOpen, setRemarksOpen] = useState(false);
  // Once Remarks hold text (typed or prefilled), keep the field visible.
  if (remarks && !remarksOpen) setRemarksOpen(true);
  const appointment = appointments.find((item) => String(item.id) === appointmentId);
  const selectedVisitType = visitTypes.find((type) => String(type.id) === visitTypeId);
  const assignedDoctor = mode === 'appointment' ? appointment?.doctor : null;

  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading
          id="check-in-visit-heading"
          icon={<ClipboardList className="size-5" />}
          title="Visit"
          description={patientTypeDescription(patientType)}
        />
        <div aria-live="polite">
          <PatientTypeBadge
            patientType={patientType}
            loading={patientTypeLoading}
            error={patientTypeError}
            onRetry={onRetryPatientType}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {historyError ? (
          <Alert>
            <AlertTitle>Recent Visit history could not be checked</AlertTitle>
            <AlertDescription>
              Review the Visit type before creating this Visit. Follow-up may apply.
            </AlertDescription>
          </Alert>
        ) : null}
        {appointment?.bookingPath === 'PROCEDURE' ? (
          <div className="bg-success/10 text-success flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-4 py-3 text-sm">
            <Sparkles className="size-4 shrink-0" aria-hidden />
            <p className="min-w-0 flex-1">
              <span className="font-semibold">Scheduled Treatment: </span>
              {appointment.treatment?.name ?? 'Treatment'}
              {appointment.treatmentSession ? ` · ${appointment.treatmentSession.label}` : ''}
            </p>
            <p className="text-xs font-medium">Links to this Visit at Check-in</p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Controller
            control={control}
            name="visitTypeId"
            render={({ field }) => (
              <Field className="bg-card rounded-lg border p-3">
                <FieldLabel htmlFor="visit-type">
                  Visit type
                  <RequiredMark />
                </FieldLabel>
                <NativeSelect
                  {...field}
                  id="visit-type"
                  aria-required
                  className="w-full"
                  disabled={loading}
                >
                  <NativeSelectOption value="">Select a Visit type</NativeSelectOption>
                  {visitTypes.map((type) => (
                    <NativeSelectOption key={type.id} value={String(type.id)}>
                      {type.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError>{errors.visitTypeId?.message}</FieldError>
                {recentDoctorVisit && selectedVisitType?.code.toUpperCase() === 'FUP' ? (
                  <p className="text-primary text-xs font-medium">
                    Suggested from {recentDoctorVisit.visitNumber} on {recentDoctorVisit.visitDate}.
                    Change it if this is a new concern.
                  </p>
                ) : null}
              </Field>
            )}
          />
          {assignedDoctor ? (
            <div className="bg-muted/40 space-y-1 rounded-lg border p-3">
              <p className="text-sm font-medium">Doctor</p>
              <p className="flex items-center gap-2 text-base font-bold">
                <Stethoscope className="text-muted-foreground size-4" aria-hidden />
                {assignedDoctor.name}
              </p>
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <Lock className="size-3" aria-hidden />
                Assigned by the Appointment.
              </p>
            </div>
          ) : (
            <Controller
              control={control}
              name="doctorId"
              render={({ field }) => (
                <Field className="bg-card rounded-lg border p-3">
                  <FieldLabel htmlFor="visit-doctor">
                    Doctor
                    <RequiredMark />
                  </FieldLabel>
                  <NativeSelect
                    {...field}
                    id="visit-doctor"
                    aria-required
                    className="w-full"
                    disabled={loading}
                  >
                    <NativeSelectOption value="">Select a Doctor</NativeSelectOption>
                    {doctors.map((doctor) => (
                      <NativeSelectOption key={doctor.id} value={String(doctor.id)}>
                        {doctor.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FieldError>{errors.doctorId?.message}</FieldError>
                </Field>
              )}
            />
          )}
          <Controller
            control={control}
            name="admitSourceId"
            render={({ field }) => (
              <Field className="bg-card rounded-lg border border-dashed p-3">
                <FieldLabel htmlFor="visit-admit-source">Admit source</FieldLabel>
                <NativeSelect
                  {...field}
                  id="visit-admit-source"
                  className="w-full"
                  disabled={loading}
                >
                  <NativeSelectOption value="">Select an Admit source</NativeSelectOption>
                  {admitSources.map((source) => (
                    <NativeSelectOption key={source.id} value={String(source.id)}>
                      {source.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError>{errors.admitSourceId?.message}</FieldError>
              </Field>
            )}
          />
        </div>

        <Controller
          control={control}
          name="chiefComplaint"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="visit-complaint">Purpose of Visit</FieldLabel>
              <RichTextEditor
                id="visit-complaint"
                aria-label="Purpose of Visit"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Patient's presenting concern"
              />
              <div className="flex items-start justify-between gap-3">
                <FieldError>{errors.chiefComplaint?.message}</FieldError>
                <p
                  className={
                    chiefComplaint.length > CHIEF_COMPLAINT_LIMIT
                      ? 'text-destructive ml-auto font-mono text-xs'
                      : 'text-muted-foreground ml-auto font-mono text-xs'
                  }
                >
                  {chiefComplaint.length} / {CHIEF_COMPLAINT_LIMIT}
                </p>
              </div>
            </Field>
          )}
        />
        {remarksOpen ? (
          <Controller
            control={control}
            name="remarks"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="visit-remarks">Remarks</FieldLabel>
                <RichTextEditor
                  id="visit-remarks"
                  aria-label="Remarks"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Front desk notes for the Doctor"
                />
              </Field>
            )}
          />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary -ml-2"
            onClick={() => setRemarksOpen(true)}
          >
            <Plus className="size-4" />
            Add remarks
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
