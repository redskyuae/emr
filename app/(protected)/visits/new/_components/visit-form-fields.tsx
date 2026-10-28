import type { Control, FieldErrors, UseFormResetField, UseFormSetValue } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { Doctor } from '@/app/api/lib/modules/doctor/schemas/doctor-schema';
import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';
import type { VisitPatientTypeAssessment } from '@/app/api/lib/modules/visit/schemas/visit-patient-type';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

import type { CreateVisitFormValues } from '../_utils/create-visit-form-schema';
import { getAppointmentVisitDefaults } from '../_utils/appointment-visit-defaults';
import { WalkInPatientSearch } from './walk-in-patient-search';

type FormProps = {
  control: Control<CreateVisitFormValues>;
  errors: FieldErrors<CreateVisitFormValues>;
  setValue: UseFormSetValue<CreateVisitFormValues>;
  resetField: UseFormResetField<CreateVisitFormValues>;
  appointments: Appointment[];
  selectedPatient: Patient | null;
  doctors: Doctor[];
  visitTypes: VisitType[];
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
}: FormProps) {
  const mode = useWatch({ control, name: 'mode' });
  function replaceField(
    name: 'appointmentId' | 'patientId' | 'doctorId' | 'visitTypeId' | 'chiefComplaint' | 'remarks',
    value: string
  ) {
    resetField(name, { defaultValue: value });
    // Visit detail fields are mounted only on the next step. Keep their values
    // in form state even when resetField has no registered input to update.
    setValue(name, value);
  }

  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle>Visit source</CardTitle>
        <CardDescription>Select today&apos;s Appointment or start a Walk-in Visit.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          value={mode}
          onValueChange={(value) => {
            setValue('mode', value as CreateVisitFormValues['mode']);
            replaceField('appointmentId', '');
            replaceField('patientId', '');
            replaceField('doctorId', '');
            replaceField('visitTypeId', '');
            replaceField('chiefComplaint', '');
            replaceField('remarks', '');
          }}
        >
          <TabsList className="grid w-full grid-cols-2 sm:w-96">
            <TabsTrigger value="appointment">From Appointment</TabsTrigger>
            <TabsTrigger value="walk-in">Walk-in</TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === 'appointment' ? (
          <Controller
            control={control}
            name="appointmentId"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="visit-appointment">
                  Appointment
                  <RequiredMark />
                </FieldLabel>
                <NativeSelect
                  {...field}
                  id="visit-appointment"
                  aria-required
                  className="w-full"
                  disabled={loading}
                  onChange={(event) => {
                    field.onChange(event);
                    const selected = appointments.find(
                      (appointment) => String(appointment.id) === event.target.value
                    );
                    const defaults = getAppointmentVisitDefaults(selected, visitTypes);
                    replaceField('visitTypeId', defaults.visitTypeId);
                    replaceField('chiefComplaint', defaults.chiefComplaint);
                    replaceField('remarks', defaults.remarks);
                    replaceField('doctorId', '');
                  }}
                >
                  <NativeSelectOption value="">Select an Appointment</NativeSelectOption>
                  {appointments.map((appointment) => (
                    <NativeSelectOption key={appointment.id} value={String(appointment.id)}>
                      {appointment.bookingNumber} · {appointment.patient.firstName}{' '}
                      {appointment.patient.lastName}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError>{errors.appointmentId?.message}</FieldError>
              </Field>
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
                  replaceField('chiefComplaint', '');
                  replaceField('remarks', '');
                }}
              />
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function VisitDetailsFields({
  control,
  errors,
  doctors,
  visitTypes,
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
  const appointment = appointments.find((item) => String(item.id) === appointmentId);
  const selectedVisitType = visitTypes.find((type) => String(type.id) === visitTypeId);

  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle>Visit details</CardTitle>
        <CardDescription>Verify Patient history and enter details for this Visit.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-md border p-4 text-sm" aria-live="polite">
          <p className="font-medium">Patient type</p>
          {patientTypeLoading ? (
            <div className="mt-2 space-y-2" aria-label="Checking completed Visit history">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-72 max-w-full" />
            </div>
          ) : patientTypeError ? (
            <p className="text-destructive mt-1">
              Could not verify Patient type.{' '}
              <button type="button" className="underline" onClick={onRetryPatientType}>
                Retry
              </button>
            </p>
          ) : patientType ? (
            <>
              <p className="mt-1 font-semibold">
                {patientType.patientType === 'ESTABLISHED' ? 'Established Patient' : 'New Patient'}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Patient record opened {patientType.patientRecordDate}.{' '}
                {patientType.lastCompletedVisit
                  ? `Last completed Visit ${patientType.lastCompletedVisit.visitNumber} on ${patientType.lastCompletedVisit.visitDate}.`
                  : 'No completed Visit in the past three years.'}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground mt-1">Select a Patient to verify type.</p>
          )}
        </div>
        {historyError ? (
          <Alert>
            <AlertTitle>Recent Visit history could not be checked</AlertTitle>
            <AlertDescription>
              Review the Visit type before creating this Visit. Follow-up may apply.
            </AlertDescription>
          </Alert>
        ) : null}
        {appointment?.bookingPath === 'PROCEDURE' ? (
          <div className="bg-muted/50 rounded-md border p-4 text-sm">
            <p className="font-medium">Scheduled Treatment</p>
            <p className="text-muted-foreground mt-1">
              {appointment.treatment?.name ?? 'Treatment'}
              {appointment.treatmentSession ? ` · ${appointment.treatmentSession.label}` : ''}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              This Treatment and Session will be linked to the Visit at Check-in. Review the
              prefilled details below.
            </p>
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="visitTypeId"
            render={({ field }) => (
              <Field>
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
                  <p className="text-muted-foreground text-xs">
                    Follow-up suggested from completed Doctor Visit {recentDoctorVisit.visitNumber}{' '}
                    on {recentDoctorVisit.visitDate}. You can change the Visit type if this is a new
                    concern.
                  </p>
                ) : null}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="doctorId"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="visit-doctor">
                  Doctor{!appointment?.doctor && <RequiredMark />}
                </FieldLabel>
                <NativeSelect
                  {...field}
                  id="visit-doctor"
                  aria-required={!appointment?.doctor}
                  className="w-full"
                  disabled={loading || Boolean(appointment?.doctor)}
                  value={appointment?.doctor ? String(appointment.doctor.id) : field.value}
                >
                  <NativeSelectOption value="">Select a Doctor</NativeSelectOption>
                  {doctors.map((doctor) => (
                    <NativeSelectOption key={doctor.id} value={String(doctor.id)}>
                      {doctor.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError>{errors.doctorId?.message}</FieldError>
                {mode === 'appointment' && appointment?.doctor ? (
                  <p className="text-muted-foreground text-xs">Assigned by the Appointment.</p>
                ) : null}
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
              <Textarea
                {...field}
                id="visit-complaint"
                rows={3}
                placeholder="Patient's presenting concern"
              />
              <FieldError>{errors.chiefComplaint?.message}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="remarks"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="visit-remarks">Remarks</FieldLabel>
              <Textarea {...field} id="visit-remarks" rows={2} />
            </Field>
          )}
        />
      </CardContent>
    </Card>
  );
}
