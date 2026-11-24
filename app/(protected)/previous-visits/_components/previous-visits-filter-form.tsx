'use client';

import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CiSearch, CiSliderHorizontal } from 'react-icons/ci';
import { PiFunnelXLight } from 'react-icons/pi';

import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { useVisitTypesQuery } from '@/app/queries/visit-masters/visit-types/useVisitTypes';
import {
  CollapsibleFilterToolbar,
  FilterSelect,
} from '@/components/app/collapsible-filter-toolbar';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { VISIT_STATUS_FILTERS } from '../../visits/_utils/visit-status';
import {
  previousVisitsFilterFormSchema,
  type PreviousVisitsFilterFormValues,
} from '../_utils/previous-visits-filter-form-schema';
import type { PreviousVisitsFilters } from '../_utils/previous-visits-filters';

// The APIs' largest page, so a Tenant's whole Doctor and Visit Type lists load at once.
const OPTION_LIMIT = 999;

const ERRORS_ID = 'previous-visits-filter-errors';
const FROM_HINT_ID = 'previous-visits-from-hint';

function toFormValues(filters: PreviousVisitsFilters): PreviousVisitsFilterFormValues {
  return {
    to: filters.to,
    from: filters.from ?? '',
    query: filters.query,
    status: filters.status,
    doctorId: filters.doctorId,
    visitTypeId: filters.visitTypeId,
  };
}

function fromFormValues(values: PreviousVisitsFilterFormValues): PreviousVisitsFilters {
  return {
    to: values.to,
    from: values.from || null,
    query: values.query.trim(),
    doctorId: values.doctorId,
    visitTypeId: values.visitTypeId,
    status: values.status as PreviousVisitsFilters['status'],
  };
}

export function PreviousVisitsFilterForm({
  applied,
  activeCount,
  advancedCount,
  onApply,
  onReset,
}: {
  applied: PreviousVisitsFilters;
  activeCount: number;
  advancedCount: number;
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
  const hasErrors = Boolean(errors.query || errors.from || errors.to);
  const errorsId = hasErrors ? ERRORS_ID : undefined;

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
    <form
      noValidate
      aria-label="Previous Visit filters"
      onSubmit={handleSubmit((values) => onApply(fromFormValues(values)))}
    >
      <CollapsibleFilterToolbar
        advancedCount={advancedCount}
        defaultExpanded={advancedCount > 0}
        notice={
          hasErrors ? (
            <FieldError
              id={ERRORS_ID}
              className="pt-3"
              errors={[errors.query, errors.from, errors.to]}
            />
          ) : null
        }
        actions={
          <>
            <Button
              type="button"
              size="lg"
              variant="ghost"
              disabled={activeCount === 0}
              onClick={onReset}
            >
              <PiFunnelXLight className="size-4" />
              Reset{activeCount > 0 ? ` (${activeCount})` : ''}
            </Button>
            <Button type="submit" size="lg">
              <CiSliderHorizontal className="size-4" />
              Apply filters
            </Button>
          </>
        }
        advanced={
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Controller
                control={control}
                name="doctorId"
                render={({ field }) => (
                  <FilterSelect
                    label="Filter by Doctor"
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
                    label="Filter by status"
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
                    label="Filter by Visit Type"
                    allLabel={
                      visitTypesQuery.isLoading ? 'Loading Visit Types…' : 'All Visit Types'
                    }
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
          </div>
        }
      >
        <InputGroup className="w-full sm:w-auto sm:min-w-64 sm:flex-1 lg:max-w-sm">
          <InputGroupAddon>
            <CiSearch className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label="Search Previous Visits"
            placeholder="Visit or legacy number, MRN, Patient name or phone"
            aria-invalid={!!errors.query}
            aria-describedby={errors.query ? errorsId : undefined}
            {...register('query')}
          />
        </InputGroup>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input
            type="date"
            aria-label="From date"
            className="min-w-0 flex-1 sm:w-40 sm:flex-none"
            max={to || undefined}
            aria-invalid={!!errors.from}
            aria-describedby={[FROM_HINT_ID, errors.from ? errorsId : undefined]
              .filter(Boolean)
              .join(' ')}
            {...register('from', { deps: ['to'] })}
          />
          <span id={FROM_HINT_ID} className="sr-only">
            Leave blank for all dates.
          </span>
          <span className="text-muted-foreground text-sm" aria-hidden="true">
            to
          </span>
          <Input
            type="date"
            aria-label="To date"
            className="min-w-0 flex-1 sm:w-40 sm:flex-none"
            min={from || undefined}
            aria-invalid={!!errors.to}
            aria-describedby={errors.to ? errorsId : undefined}
            {...register('to', { deps: ['from'] })}
          />
        </div>
      </CollapsibleFilterToolbar>
    </form>
  );
}
