'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import {
  consolidatedReportFormSchema,
  type ConsolidatedReportFormValues,
} from '../_utils/consolidated-report-form-schema';
import { thisMonthPeriod } from '../_utils/consolidated-report-period';
import { ReportCard, RequiredMark } from './report-card';
import { ReportPatientSearch } from './report-patient-search';

export function ConsolidatedReportCard() {
  const [today] = useState(() => new Date());
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConsolidatedReportFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(consolidatedReportFormSchema),
    defaultValues: { patientId: '', ...thisMonthPeriod(today) },
  });
  const [from, to] = useWatch({ control, name: ['from', 'to'] });

  return (
    <ReportCard
      title="Consolidated Patient Report"
      description="One Patient's diagnoses, Treatment Plans, medications and Visit-wise progress over a period, ready to print."
      requirement="Needs Visit permission."
      onSubmit={handleSubmit((values) => {
        const params = new URLSearchParams({
          patient: values.patientId,
          from: values.from,
          to: values.to,
        });
        router.push(`/reports/consolidated?${params}`);
      })}
    >
      <div className="space-y-4">
        <Controller
          control={control}
          name="patientId"
          render={({ field, fieldState }) => (
            <ReportPatientSearch
              value={field.value}
              error={fieldState.error?.message}
              onBlur={field.onBlur}
              onChange={field.onChange}
            />
          )}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field data-invalid={!!errors.from}>
            <FieldLabel htmlFor="consolidated-report-from">
              From
              <RequiredMark />
            </FieldLabel>
            <Input
              id="consolidated-report-from"
              type="date"
              max={to || undefined}
              aria-required
              aria-invalid={!!errors.from}
              {...register('from', { deps: ['to'] })}
            />
            <FieldError errors={[errors.from]} />
          </Field>

          <Field data-invalid={!!errors.to}>
            <FieldLabel htmlFor="consolidated-report-to">
              To
              <RequiredMark />
            </FieldLabel>
            <Input
              id="consolidated-report-to"
              type="date"
              min={from || undefined}
              aria-required
              aria-invalid={!!errors.to}
              {...register('to', { deps: ['from'] })}
            />
            <FieldError errors={[errors.to]} />
          </Field>
        </div>
      </div>
    </ReportCard>
  );
}
