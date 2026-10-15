import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { Doctor } from '@/app/api/lib/modules/doctor/schemas/doctor-schema';
import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import type { CreateVisitFormValues } from '../_utils/create-visit-form-schema';

type FormProps = {
  control: Control<CreateVisitFormValues>;
  errors: FieldErrors<CreateVisitFormValues>;
  setValue: UseFormSetValue<CreateVisitFormValues>;
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  visitTypes: VisitType[];
  loading: boolean;
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
  appointments,
  patients,
  loading,
}: FormProps) {
  const mode = useWatch({ control, name: 'mode' });

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
            setValue('appointmentId', '');
            setValue('patientId', '');
            setValue('doctorId', '');
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
              <Field>
                <FieldLabel htmlFor="visit-patient">
                  Patient
                  <RequiredMark />
                </FieldLabel>
                <NativeSelect
                  {...field}
                  id="visit-patient"
                  aria-required
                  className="w-full"
                  disabled={loading}
                >
                  <NativeSelectOption value="">Select a Patient</NativeSelectOption>
                  {patients.map((patient) => (
                    <NativeSelectOption key={patient.id} value={String(patient.id)}>
                      {patient.firstName} {patient.lastName} · {patient.mrn}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError>{errors.patientId?.message}</FieldError>
              </Field>
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
}: FormProps) {
  const mode = useWatch({ control, name: 'mode' });
  const appointmentId = useWatch({ control, name: 'appointmentId' });
  const appointment = appointments.find((item) => String(item.id) === appointmentId);

  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle>Visit details</CardTitle>
        <CardDescription>These details are saved on the Visit.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
