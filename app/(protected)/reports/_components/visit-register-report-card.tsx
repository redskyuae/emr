'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  visitRegisterReportFormSchema,
  type VisitRegisterReportFormValues,
} from '../_utils/report-form-schemas';
import { defaultVisitRegisterPeriod } from '../_utils/report-periods';
import { notifyReportNotAvailable, ReportCard, RequiredMark } from './report-card';

export function VisitRegisterReportCard() {
  const [today] = useState(() => new Date());
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VisitRegisterReportFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(visitRegisterReportFormSchema),
    defaultValues: defaultVisitRegisterPeriod(today),
  });
  const [from, to] = useWatch({ control, name: ['from', 'to'] });

  return (
    <ReportCard
      title="Visit Register"
      description="Every Visit in the period, with Patient, Doctor, Visit Type and status."
      requirement="Needs Visit permission."
      onSubmit={handleSubmit(notifyReportNotAvailable)}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field data-invalid={!!errors.from}>
          <FieldLabel htmlFor="visit-register-from">
            From
            <RequiredMark />
          </FieldLabel>
          <Input
            id="visit-register-from"
            type="date"
            max={to || undefined}
            aria-required
            aria-invalid={!!errors.from}
            {...register('from', { deps: ['to'] })}
          />
          <FieldError errors={[errors.from]} />
        </Field>

        <Field data-invalid={!!errors.to}>
          <FieldLabel htmlFor="visit-register-to">
            To
            <RequiredMark />
          </FieldLabel>
          <Input
            id="visit-register-to"
            type="date"
            min={from || undefined}
            aria-required
            aria-invalid={!!errors.to}
            {...register('to', { deps: ['from'] })}
          />
          <FieldError errors={[errors.to]} />
        </Field>
      </div>
    </ReportCard>
  );
}
