'use client';

import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CiSearch, CiSliderHorizontal } from 'react-icons/ci';
import { PiFunnelXLight } from 'react-icons/pi';

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
import {
  ALL_OPTIONS,
  auditLogFilterFormSchema,
  type AuditLogFilterFormValues,
} from '../_utils/audit-log-filter-form-schema';
import {
  AUDIT_MODULE_OPTIONS,
  AUDIT_OPERATION_OPTIONS,
  type AuditLogFilters,
} from '../_utils/audit-log-filters';

/** The form edits dates, Module, Operation and search; Patient and Visit scope come from links. */
export type EditableAuditLogFilters = Pick<
  AuditLogFilters,
  'from' | 'to' | 'module' | 'operation' | 'query'
>;

function toFormValues(filters: EditableAuditLogFilters): AuditLogFilterFormValues {
  return {
    to: filters.to ?? '',
    from: filters.from ?? '',
    query: filters.query,
    module: filters.module ?? ALL_OPTIONS,
    operation: filters.operation ?? ALL_OPTIONS,
  };
}

function fromFormValues(values: AuditLogFilterFormValues): EditableAuditLogFilters {
  const pick = (value: string) => (value === ALL_OPTIONS ? null : value);

  return {
    to: values.to || null,
    from: values.from || null,
    query: values.query.trim(),
    module: pick(values.module) as AuditLogFilters['module'],
    operation: pick(values.operation) as AuditLogFilters['operation'],
  };
}

type FilterSelectProps = {
  id: string;
  label: string;
  value: string;
  allLabel: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
};

function FilterSelect({ id, label, value, allLabel, options, onChange }: FilterSelectProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_OPTIONS}>{allLabel}</SelectItem>
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

export function AuditLogFilterForm({
  applied,
  activeCount,
  onApply,
  onReset,
}: {
  applied: EditableAuditLogFilters;
  activeCount: number;
  onApply: (filters: EditableAuditLogFilters) => void;
  onReset: () => void;
}) {
  const form = useForm<AuditLogFilterFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(auditLogFilterFormSchema),
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
    reset(toFormValues(JSON.parse(appliedKey) as EditableAuditLogFilters));
  }, [appliedKey, reset]);

  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <form
          noValidate
          aria-label="Audit Log filters"
          className="space-y-4"
          onSubmit={handleSubmit((values) => onApply(fromFormValues(values)))}
        >
          <Field className="xl:max-w-xl" data-invalid={!!errors.query}>
            <FieldLabel htmlFor="audit-log-search">Search</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <CiSearch className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                id="audit-log-search"
                type="search"
                placeholder="User, Role, action, MRN, Patient name or Visit Number"
                aria-invalid={!!errors.query}
                {...register('query')}
              />
            </InputGroup>
            <FieldError errors={[errors.query]} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field data-invalid={!!errors.from}>
              <FieldLabel htmlFor="audit-log-from">From date</FieldLabel>
              <Input
                id="audit-log-from"
                type="date"
                max={to || undefined}
                aria-invalid={!!errors.from}
                {...register('from', { deps: ['to'] })}
              />
              <FieldDescription>Leave both blank for all dates.</FieldDescription>
              <FieldError errors={[errors.from]} />
            </Field>

            <Field data-invalid={!!errors.to}>
              <FieldLabel htmlFor="audit-log-to">To date</FieldLabel>
              <Input
                id="audit-log-to"
                type="date"
                min={from || undefined}
                aria-invalid={!!errors.to}
                {...register('to', { deps: ['from'] })}
              />
              <FieldError errors={[errors.to]} />
            </Field>

            <Controller
              control={control}
              name="module"
              render={({ field }) => (
                <FilterSelect
                  id="audit-log-module"
                  label="Module"
                  allLabel="All modules"
                  value={field.value}
                  options={AUDIT_MODULE_OPTIONS}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              control={control}
              name="operation"
              render={({ field }) => (
                <FilterSelect
                  id="audit-log-operation"
                  label="Operation"
                  allLabel="All operations"
                  value={field.value}
                  options={AUDIT_OPERATION_OPTIONS}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" disabled={activeCount === 0} onClick={onReset}>
              <PiFunnelXLight className="size-4" />
              Reset{activeCount > 0 ? ` (${activeCount})` : ''}
            </Button>
            <Button type="submit">
              <CiSliderHorizontal className="size-4" />
              Apply filters
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
