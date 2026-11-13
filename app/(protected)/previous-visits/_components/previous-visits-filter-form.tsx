'use client';

import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FilterX, Search, SlidersHorizontal } from 'lucide-react';

import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { useVisitTypesQuery } from '@/app/queries/visit-masters/visit-types/useVisitTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VISIT_STATUS_FILTERS } from '../../visits/_utils/visit-status';
import {
  ALL_FILTER,
  previousVisitsFilterFormSchema,
  type PreviousVisitsFilterFormValues,
} from '../_utils/previous-visits-filter-form-schema';
import type { PreviousVisitsFilters } from '../_utils/previous-visits-filters';

// Large enough to hold a Tenant's whole Doctor and Visit Type lists in one page.
const OPTION_LIMIT = 100;

function toFormValues(filters: PreviousVisitsFilters): PreviousVisitsFilterFormValues {
  return {
    to: filters.to,
    from: filters.from ?? '',
    query: filters.query,
    status: filters.status ?? ALL_FILTER,
    doctorId: filters.doctorId ?? ALL_FILTER,
    visitTypeId: filters.visitTypeId ?? ALL_FILTER,
  };
}

function fromFormValues(values: PreviousVisitsFilterFormValues): PreviousVisitsFilters {
  const pick = (value: string) => (value === ALL_FILTER ? null : value);

  return {
    to: values.to,
    from: values.from || null,
    query: values.query.trim(),
    doctorId: pick(values.doctorId),
    visitTypeId: pick(values.visitTypeId),
    status: pick(values.status) as PreviousVisitsFilters['status'],
  };
}

type FilterSelectProps = {
  id: string;
  label: string;
  value: string;
  allLabel: string;
  disabled?: boolean;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
};

function FilterSelect({
  id,
  label,
  value,
  allLabel,
  disabled,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="h-9 w-full">
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_FILTER}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function PreviousVisitsFilterForm({
  applied,
  activeCount,
  onApply,
  onReset,
}: {
  applied: PreviousVisitsFilters;
  activeCount: number;
  onApply: (filters: PreviousVisitsFilters) => void;
  onReset: () => void;
}) {
  const doctorsQuery = useDoctorsQuery({ page: 1, limit: OPTION_LIMIT });
  const visitTypesQuery = useVisitTypesQuery({ page: 1, limit: OPTION_LIMIT });

  const form = useForm<PreviousVisitsFilterFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(previousVisitsFilterFormSchema),
    defaultValues: toFormValues(applied),
  });
  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = form;
  const [from, to] = useWatch({ control, name: ['from', 'to'] });

  // Back/forward navigation and Reset change the applied filters from outside
  // the form; mirror them so the form always shows what the list is showing.
  const appliedKey = JSON.stringify(applied);
  useEffect(() => {
    reset(toFormValues(JSON.parse(appliedKey) as PreviousVisitsFilters));
  }, [appliedKey, reset]);

  const doctorOptions = (doctorsQuery.data?.data ?? []).map((doctor) => ({
    value: String(doctor.id),
    label: doctor.name,
  }));
  const visitTypeOptions = (visitTypesQuery.data?.data ?? []).map((visitType) => ({
    value: String(visitType.id),
    label: visitType.name,
  }));

  return (
    <Card className="shadow-fluent-2 py-0">
      <CardContent className="p-4">
        <form
          noValidate
          aria-label="Previous Visit filters"
          className="space-y-4"
          onSubmit={handleSubmit((values) => onApply(fromFormValues(values)))}
        >
          <Field className="xl:max-w-md" data-invalid={!!errors.query}>
            <FieldLabel htmlFor="previous-visits-search">Search</FieldLabel>
            <InputGroup className="bg-background h-9">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                id="previous-visits-search"
                type="search"
                placeholder="Visit or legacy number, MRN, Patient name or phone"
                aria-invalid={!!errors.query}
                {...register('query')}
              />
            </InputGroup>
            <FieldError errors={[errors.query]} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field data-invalid={!!errors.from}>
              <FieldLabel htmlFor="previous-visits-from">From date</FieldLabel>
              <Input
                id="previous-visits-from"
                type="date"
                className="h-9"
                max={to || undefined}
                aria-invalid={!!errors.from}
                {...register('from', { deps: ['to'] })}
              />
              <FieldDescription>Leave blank for all dates.</FieldDescription>
              <FieldError errors={[errors.from]} />
            </Field>

            <Field data-invalid={!!errors.to}>
              <FieldLabel htmlFor="previous-visits-to">To date</FieldLabel>
              <Input
                id="previous-visits-to"
                type="date"
                className="h-9"
                min={from || undefined}
                aria-invalid={!!errors.to}
                {...register('to', { deps: ['from'] })}
              />
              <FieldError errors={[errors.to]} />
            </Field>

            <Controller
              control={control}
              name="doctorId"
              render={({ field }) => (
                <FilterSelect
                  id="previous-visits-doctor"
                  label="Doctor"
                  allLabel={doctorsQuery.isLoading ? 'Loading Doctors…' : 'All Doctors'}
                  value={field.value}
                  disabled={doctorsQuery.isLoading || doctorsQuery.isError}
                  options={doctorOptions}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <FilterSelect
                  id="previous-visits-status"
                  label="Status"
                  allLabel="All statuses"
                  value={field.value}
                  options={VISIT_STATUS_FILTERS}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              control={control}
              name="visitTypeId"
              render={({ field }) => (
                <FilterSelect
                  id="previous-visits-type"
                  label="Visit Type"
                  allLabel={visitTypesQuery.isLoading ? 'Loading Visit Types…' : 'All Visit Types'}
                  value={field.value}
                  disabled={visitTypesQuery.isLoading || visitTypesQuery.isError}
                  options={visitTypeOptions}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {doctorsQuery.isError || visitTypesQuery.isError ? (
            <p className="text-destructive text-sm" role="alert">
              Could not load the {doctorsQuery.isError ? 'Doctor' : 'Visit Type'} filter options.
              You can still filter by date, status and search.
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" disabled={activeCount === 0} onClick={onReset}>
              <FilterX className="size-4" />
              Reset{activeCount > 0 ? ` (${activeCount})` : ''}
            </Button>
            <Button type="submit">
              <SlidersHorizontal className="size-4" />
              Apply filters
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
