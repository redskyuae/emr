'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { useAdmissionsQuery } from '@/app/queries/admissions/useAdmissions';
import { usePatientQuery, usePatientsQuery } from '@/app/queries/patients/usePatients';
import { useVisitsQuery } from '@/app/queries/visits/useVisits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import type { CreateInvoiceFormValues } from '../_utils/create-invoice-form-schema';

export function ComposerPatientCard() {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<CreateInvoiceFormValues>();
  const patientId = useWatch({ control, name: 'patientId' });
  const encounterKind = useWatch({ control, name: 'encounterKind' });
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, { wait: 300 });
  const patientsQuery = usePatientsQuery({
    page: 1,
    limit: 30,
    isActive: true,
    query: debouncedSearch || undefined,
  });
  const selectedPatientQuery = usePatientQuery(patientId ? Number(patientId) : null);
  const patients = patientsQuery.data?.data ?? [];
  const selectedPatient = selectedPatientQuery.data;

  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle className="text-base">Patient &amp; encounter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field data-invalid={Boolean(errors.patientId)}>
            <FieldLabel htmlFor="composer-patient">
              Patient{' '}
              <span aria-hidden className="text-destructive">
                *
              </span>
            </FieldLabel>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or MRN…"
              aria-label="Search Patients"
            />
            <Controller
              control={control}
              name="patientId"
              render={({ field }) => (
                <NativeSelect
                  id="composer-patient"
                  className="w-full"
                  aria-required
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event.target.value);
                    setValue('visitId', '');
                    setValue('admissionId', '');
                  }}
                >
                  <option value="">Select a Patient</option>
                  {selectedPatient &&
                  !patients.some((patient) => patient.id === selectedPatient.id) ? (
                    <option value={selectedPatient.id}>
                      {selectedPatient.firstName} {selectedPatient.lastName} · {selectedPatient.mrn}
                    </option>
                  ) : null}
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} · {patient.mrn}
                    </option>
                  ))}
                </NativeSelect>
              )}
            />
            {errors.patientId ? <FieldError>{errors.patientId.message}</FieldError> : null}
            {patientsQuery.isError ? (
              <FieldError>Could not load Patients. Search again.</FieldError>
            ) : null}
            {selectedPatientQuery.isError ? (
              <FieldError>Could not load the selected Patient.</FieldError>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="composer-encounter-kind">Link to encounter</FieldLabel>
            <Controller
              control={control}
              name="encounterKind"
              render={({ field }) => (
                <NativeSelect
                  id="composer-encounter-kind"
                  className="w-full"
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event.target.value);
                    setValue('visitId', '');
                    setValue('admissionId', '');
                  }}
                >
                  <option value="none">No encounter (counter sale)</option>
                  <option value="visit">Visit</option>
                  <option value="admission">Admission</option>
                </NativeSelect>
              )}
            />
            {encounterKind !== 'none' && !patientId ? (
              <NativeSelect className="w-full" disabled aria-label="Encounter">
                <option>Choose a Patient first</option>
              </NativeSelect>
            ) : null}
            {encounterKind === 'visit' && patientId ? (
              <ComposerVisitSelect patientId={Number(patientId)} />
            ) : null}
            {encounterKind === 'admission' && patientId ? (
              <ComposerAdmissionSelect patientId={Number(patientId)} />
            ) : null}
            {errors.visitId ? <FieldError>{errors.visitId.message}</FieldError> : null}
            {errors.admissionId ? <FieldError>{errors.admissionId.message}</FieldError> : null}
          </Field>
        </div>
        {selectedPatient ? (
          <div className="bg-accent/50 rounded-md border p-3 text-sm">
            <span className="font-semibold">
              {selectedPatient.firstName} {selectedPatient.lastName}
            </span>
            <span className="text-muted-foreground font-mono"> · {selectedPatient.mrn}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ComposerVisitSelect({ patientId }: { patientId: number }) {
  const { control } = useFormContext<CreateInvoiceFormValues>();
  const visitsQuery = useVisitsQuery({ page: 1, limit: 50, patientId });
  return (
    <>
      <Controller
        control={control}
        name="visitId"
        render={({ field }) => (
          <NativeSelect
            aria-label="Visit"
            aria-required
            className="w-full"
            value={field.value}
            onChange={field.onChange}
          >
            <option value="">Select a Visit</option>
            {(visitsQuery.data?.data ?? []).map((visit) => (
              <option key={visit.id} value={visit.id}>
                {visit.visitNumber} · {visit.visitDate}
              </option>
            ))}
          </NativeSelect>
        )}
      />
      {visitsQuery.isError ? <FieldError>Could not load Visits.</FieldError> : null}
    </>
  );
}

function ComposerAdmissionSelect({ patientId }: { patientId: number }) {
  const { control } = useFormContext<CreateInvoiceFormValues>();
  const admissionsQuery = useAdmissionsQuery({ page: 1, limit: 50, patientId });
  return (
    <>
      <Controller
        control={control}
        name="admissionId"
        render={({ field }) => (
          <NativeSelect
            aria-label="Admission"
            aria-required
            className="w-full"
            value={field.value}
            onChange={field.onChange}
          >
            <option value="">Select an Admission</option>
            {(admissionsQuery.data?.data ?? []).map((admission) => (
              <option key={admission.id} value={admission.id}>
                {admission.admissionNumber}
              </option>
            ))}
          </NativeSelect>
        )}
      />
      {admissionsQuery.isError ? <FieldError>Could not load Admissions.</FieldError> : null}
    </>
  );
}
