'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  doctorVisitSummaryReportFormSchema,
  type DoctorVisitSummaryReportFormValues,
} from '../_utils/report-form-schemas';
import { defaultSummaryMonth } from '../_utils/report-periods';
import { notifyReportNotAvailable, ReportCard, RequiredMark } from './report-card';

export function DoctorVisitSummaryReportCard() {
  const [today] = useState(() => new Date());
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DoctorVisitSummaryReportFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(doctorVisitSummaryReportFormSchema),
    defaultValues: { month: defaultSummaryMonth(today) },
  });

  return (
    <ReportCard
      title="Doctor-wise Visit Summary"
      description="Visit counts per Doctor per day for a month, as a grid with totals."
      requirement="Needs Visit permission."
      onSubmit={handleSubmit(notifyReportNotAvailable)}
    >
      <Field className="sm:max-w-56" data-invalid={!!errors.month}>
        <FieldLabel htmlFor="doctor-visit-summary-month">
          Month
          <RequiredMark />
        </FieldLabel>
        <Input
          id="doctor-visit-summary-month"
          type="month"
          aria-required
          aria-invalid={!!errors.month}
          {...register('month')}
        />
        <FieldError errors={[errors.month]} />
      </Field>
    </ReportCard>
  );
}
