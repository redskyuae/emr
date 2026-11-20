'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { CiSearch } from 'react-icons/ci';
import { PiArrowsCounterClockwiseLight, PiCheckBold } from 'react-icons/pi';

import { usePatientQuery, usePatientsQuery } from '@/app/queries/patients/usePatients';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { patientInitials, patientFullName } from '../_utils/consolidated-report-format';
import { RequiredMark } from './report-card';

// A short list keeps the report card compact; a narrower search finds the rest.
const RESULT_LIMIT = 5;

type PatientRowData = {
  id: number;
  mrn: string;
  phone: string;
  title: string | null;
  lastName: string;
  firstName: string;
  middleName: string | null;
};

function PatientRow({
  patient,
  selected,
  onSelect,
}: {
  patient: PatientRowData;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      // Keep focus in the search box while clicking, so its blur does not flag the field first.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className={cn(
        'focus-visible:ring-ring/50 flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors outline-none focus-visible:ring-3',
        selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/60'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-8 flex-none place-items-center rounded-full text-xs font-semibold',
          selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}
      >
        {patientInitials(patient)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{patientFullName(patient)}</span>
        <span className="text-muted-foreground block truncate text-xs">
          <span className="font-mono">{patient.mrn}</span> · {patient.phone}
        </span>
      </span>
      {selected ? <PiCheckBold className="text-primary size-4 flex-none" /> : null}
    </button>
  );
}

function PatientRowsSkeleton() {
  return (
    <div className="space-y-2" aria-label="Searching Patients">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-lg border px-3 py-2">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-44 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Finds a Patient by name, MRN or phone; the chosen Patient stays shown under the search. */
export function ReportPatientSearch({
  value,
  error,
  onBlur,
  onChange,
}: {
  value: string;
  error?: string;
  onBlur: () => void;
  onChange: (patientId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search.trim(), { wait: 300 });
  const searching = search.trim().length > 0;
  const searchReady = searching && search.trim() === debouncedSearch;
  const patientsQuery = usePatientsQuery(
    { page: 1, limit: RESULT_LIMIT, query: debouncedSearch },
    { enabled: debouncedSearch.length > 0 }
  );
  const selectedQuery = usePatientQuery(value ? Number(value) : null);
  const results = searchReady && !patientsQuery.isFetching ? (patientsQuery.data?.data ?? []) : [];

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="consolidated-report-patient">
        Patient
        <RequiredMark />
      </FieldLabel>
      <InputGroup className="w-full">
        <InputGroupAddon>
          <CiSearch className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          id="consolidated-report-patient"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onBlur={onBlur}
          placeholder="Search by name, MRN or phone"
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-controls="consolidated-report-patients"
          autoComplete="off"
        />
      </InputGroup>
      <FieldError>{error}</FieldError>

      <div
        id="consolidated-report-patients"
        role="radiogroup"
        aria-label="Patients"
        aria-live="polite"
        className="space-y-2"
      >
        {searching ? (
          patientsQuery.isError && searchReady && !patientsQuery.isFetching ? (
            <div className="space-y-2 rounded-lg border p-3 text-sm">
              <p className="text-destructive">{patientsQuery.error.message}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void patientsQuery.refetch()}
              >
                <PiArrowsCounterClockwiseLight className="size-4" /> Retry search
              </Button>
            </div>
          ) : (
            <SkeletonCrossfade
              isLoading={!searchReady || patientsQuery.isFetching}
              skeleton={<PatientRowsSkeleton />}
            >
              {results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((patient) => (
                    <PatientRow
                      key={patient.id}
                      patient={patient}
                      selected={String(patient.id) === value}
                      onSelect={() => {
                        onChange(String(patient.id));
                        setSearch('');
                      }}
                    />
                  ))}
                  {(patientsQuery.data?.meta.total ?? 0) > results.length ? (
                    <p className="text-muted-foreground px-1 text-xs">
                      More Patients match. Enter more details to narrow the search.
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-2.5 text-sm">
                  No Patients match this search.
                </p>
              )}
            </SkeletonCrossfade>
          )
        ) : selectedQuery.data ? (
          <PatientRow patient={selectedQuery.data} selected onSelect={() => undefined} />
        ) : value && selectedQuery.isPending ? (
          <PatientRowsSkeleton />
        ) : null}
      </div>
    </Field>
  );
}
