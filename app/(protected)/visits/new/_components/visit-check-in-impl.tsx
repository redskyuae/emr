'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import { useAppointmentReasonsQuery } from '@/app/queries/appointment-masters/reasons/useAppointmentReasons';
import { useAppointmentTypesQuery } from '@/app/queries/appointment-masters/types/useAppointmentTypes';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { usePatientQuery } from '@/app/queries/patients/usePatients';
import { useCreateVisit } from '@/app/queries/visits/useCreateVisit';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  visitCheckInFormSchema,
  type VisitCheckInFormValues,
} from '../../_utils/visit-form-schema';
import { PatientCombobox } from './patient-combobox';

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      {' '}
      *
    </span>
  );
}

function patientFullName(patient: {
  firstName: string;
  middleName: string | null;
  lastName: string;
}) {
  return [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
}

export function VisitCheckInImpl({ initialPatientId }: { initialPatientId: number | null }) {
  const router = useRouter();
  const [selectedPatientLabel, setSelectedPatientLabel] = useState<string | null>(null);
  const [syncedPrefillId, setSyncedPrefillId] = useState<number | null>(null);

  const createMutation = useCreateVisit();
  const doctorsQuery = useDoctorsQuery({ limit: 100, status: 'active' });
  const appointmentTypesQuery = useAppointmentTypesQuery({ limit: 100 });
  const appointmentReasonsQuery = useAppointmentReasonsQuery({ limit: 100 });
  const prefillPatientQuery = usePatientQuery(initialPatientId);

  const form = useForm<VisitCheckInFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(visitCheckInFormSchema),
    defaultValues: {
      patientId: initialPatientId ?? undefined,
      doctorId: undefined,
      appointmentTypeId: undefined,
      appointmentReasonId: undefined,
      chiefComplaint: '',
      notes: '',
    },
  });

  // Fill in the picker's label once the prefilled Patient loads, without an effect.
  if (
    initialPatientId !== null &&
    initialPatientId !== syncedPrefillId &&
    prefillPatientQuery.data
  ) {
    setSyncedPrefillId(initialPatientId);
    setSelectedPatientLabel(patientFullName(prefillPatientQuery.data));
  }

  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const isSaving = createMutation.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    try {
      const created = await createMutation.mutateAsync({
        patientId: values.patientId,
        doctorId: values.doctorId,
        appointmentTypeId: values.appointmentTypeId,
        appointmentReasonId: values.appointmentReasonId,
        chiefComplaint: values.chiefComplaint.trim() || undefined,
        notes: values.notes.trim() || undefined,
      });
      toast.success(`Visit ${created.data.visitNumber} checked in.`);
      router.push(`/visits/${created.data.id}`);
    } catch (error) {
      setServerErrors(getApiErrors(error));
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {serverErrors.length > 0 ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not check in Visit</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {serverErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="shadow-fluent-2">
        <CardHeader>
          <CardTitle>Visit details</CardTitle>
          <CardDescription>Who the Visit is for and how to classify it.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Controller
                control={form.control}
                name="patientId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Patient
                      <RequiredMark />
                    </FieldLabel>
                    <PatientCombobox
                      value={field.value}
                      selectedLabel={selectedPatientLabel}
                      disabled={isSaving}
                      invalid={fieldState.invalid}
                      onSelect={(patient) => {
                        field.onChange(patient.id);
                        setSelectedPatientLabel(`${patient.name} (${patient.mrn})`);
                      }}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="doctorId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="visit-doctor">Doctor</FieldLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      disabled={isSaving}
                    >
                      <SelectTrigger id="visit-doctor" className="w-full">
                        <SelectValue placeholder="Assign later" />
                      </SelectTrigger>
                      <SelectContent>
                        {(doctorsQuery.data?.data ?? []).map((doctor) => (
                          <SelectItem key={doctor.id} value={String(doctor.id)}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="appointmentTypeId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="visit-appointment-type">
                      Visit type
                      <RequiredMark />
                    </FieldLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      disabled={isSaving}
                    >
                      <SelectTrigger
                        id="visit-appointment-type"
                        className="w-full"
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select visit type" />
                      </SelectTrigger>
                      <SelectContent>
                        {(appointmentTypesQuery.data?.data ?? []).map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="appointmentReasonId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="visit-appointment-reason">Reason</FieldLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      disabled={isSaving}
                    >
                      <SelectTrigger id="visit-appointment-reason" className="w-full">
                        <SelectValue placeholder="Not specified" />
                      </SelectTrigger>
                      <SelectContent>
                        {(appointmentReasonsQuery.data?.data ?? []).map((reason) => (
                          <SelectItem key={reason.id} value={String(reason.id)}>
                            {reason.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="chiefComplaint"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="visit-chief-complaint">Chief complaint</FieldLabel>
                    <Textarea
                      id="visit-chief-complaint"
                      {...field}
                      disabled={isSaving}
                      rows={3}
                      placeholder="e.g. Fever for 3 days"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="notes"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="visit-notes">Notes</FieldLabel>
                    <Textarea
                      id="visit-notes"
                      {...field}
                      disabled={isSaving}
                      rows={3}
                      placeholder="Optional notes"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/visits')}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
          <Save className="size-4" />
          Check in
        </Button>
      </div>
    </form>
  );
}
