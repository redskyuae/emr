'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { RefreshCcw, Search, UserRound } from 'lucide-react';
import type { ControllerRenderProps } from 'react-hook-form';

import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import { usePatientsQuery } from '@/app/queries/patients/usePatients';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

import type { CreateVisitFormValues } from '../_utils/create-visit-form-schema';

type PatientField = ControllerRenderProps<CreateVisitFormValues, 'patientId'>;

export function WalkInPatientSearch({
  field,
  error,
  selectedPatient,
  onSelect,
}: {
  field: PatientField;
  error?: string;
  selectedPatient: Patient | null;
  onSelect: (patientId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search.trim(), { wait: 300 });
  const searchReady = search.trim().length > 0 && search.trim() === debouncedSearch;
  const patientsQuery = usePatientsQuery(
    { page: 1, limit: 20, isActive: true, query: debouncedSearch },
    { enabled: debouncedSearch.length > 0 }
  );
  const patients = searchReady && !patientsQuery.isFetching ? (patientsQuery.data?.data ?? []) : [];

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="visit-patient-search">
        Patient{' '}
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      </FieldLabel>
      <InputGroup className="w-full">
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          id="visit-patient-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onBlur={field.onBlur}
          placeholder="Search by name, MRN, phone, or date of birth"
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-controls="walk-in-patient-results"
          autoComplete="off"
        />
      </InputGroup>
      <FieldError>{error}</FieldError>

      {field.value && selectedPatient ? (
        <div className="border-primary/30 bg-primary/5 flex items-center gap-3 rounded-lg border p-3">
          <UserRound className="text-primary size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {selectedPatient.firstName} {selectedPatient.lastName}
            </p>
            <p className="text-muted-foreground text-xs">
              <span className="font-mono">{selectedPatient.mrn}</span>
              {selectedPatient.dateOfBirth ? ` · DOB ${selectedPatient.dateOfBirth}` : ''}
              {' · '}
              {selectedPatient.phone}
            </p>
          </div>
          <span className="text-primary text-xs font-medium">Selected</span>
        </div>
      ) : null}

      {search.trim() ? (
        <div
          id="walk-in-patient-results"
          className="max-h-72 space-y-1 overflow-y-auto rounded-lg border p-1"
          aria-live="polite"
        >
          {!searchReady || patientsQuery.isFetching ? (
            <p className="text-muted-foreground p-3 text-sm">Searching Patients…</p>
          ) : patientsQuery.isError ? (
            <div className="space-y-2 p-3 text-sm">
              <p className="text-destructive">{patientsQuery.error.message}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void patientsQuery.refetch()}
              >
                <RefreshCcw className="size-4" /> Retry search
              </Button>
            </div>
          ) : patients.length ? (
            <>
              {patients.map((patient) => (
                <Button
                  key={patient.id}
                  type="button"
                  variant="ghost"
                  className="h-auto w-full justify-start gap-3 px-3 py-2 text-left whitespace-normal"
                  onClick={() => {
                    onSelect(String(patient.id));
                    setSearch('');
                  }}
                >
                  <UserRound className="text-muted-foreground size-4 shrink-0" />
                  <span className="min-w-0">
                    <span className="block font-medium">
                      {patient.firstName} {patient.lastName}
                    </span>
                    <span className="text-muted-foreground block text-xs">
                      <span className="font-mono">{patient.mrn}</span>
                      {patient.dateOfBirth ? ` · DOB ${patient.dateOfBirth}` : ''}
                      {' · '}
                      {patient.phone}
                    </span>
                  </span>
                </Button>
              ))}
              {(patientsQuery.data?.meta.total ?? 0) > patients.length ? (
                <p className="text-muted-foreground px-3 py-2 text-xs">
                  More Patients match. Enter more details to narrow the search.
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground p-3 text-sm">
              No active Patients match this search.
            </p>
          )}
        </div>
      ) : null}
    </Field>
  );
}
