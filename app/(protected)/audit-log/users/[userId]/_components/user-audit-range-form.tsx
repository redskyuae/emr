'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CiSliderHorizontal } from 'react-icons/ci';
import { PiFunnelXLight } from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { UserAuditRange } from '../../_utils/user-audit-range';
import {
  userAuditRangeFormSchema,
  type UserAuditRangeFormValues,
} from '../_utils/user-audit-range-form-schema';

export function UserAuditRangeForm({
  applied,
  isDefault,
  onApply,
  onReset,
}: {
  applied: UserAuditRange;
  isDefault: boolean;
  onApply: (range: UserAuditRange) => void;
  onReset: () => void;
}) {
  const form = useForm<UserAuditRangeFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(userAuditRangeFormSchema),
    defaultValues: applied,
  });
  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = form;
  const [from, to] = useWatch({ control, name: ['from', 'to'] });

  // Back/forward navigation and Reset change the range from outside the form.
  const { from: appliedFrom, to: appliedTo } = applied;
  useEffect(() => {
    reset({ from: appliedFrom, to: appliedTo });
  }, [appliedFrom, appliedTo, reset]);

  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <form
          noValidate
          aria-label="User Audit date range"
          className="flex flex-col gap-4 lg:flex-row lg:items-start"
          onSubmit={handleSubmit((values) => onApply(values))}
        >
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:max-w-xl">
            <Field data-invalid={!!errors.from}>
              <FieldLabel htmlFor="user-audit-from">From date</FieldLabel>
              <Input
                id="user-audit-from"
                type="date"
                max={to || undefined}
                aria-invalid={!!errors.from}
                {...register('from', { deps: ['to'] })}
              />
              <FieldError errors={[errors.from]} />
            </Field>
            <Field data-invalid={!!errors.to}>
              <FieldLabel htmlFor="user-audit-to">To date</FieldLabel>
              <Input
                id="user-audit-to"
                type="date"
                min={from || undefined}
                aria-invalid={!!errors.to}
                {...register('to', { deps: ['from'] })}
              />
              <FieldError errors={[errors.to]} />
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end lg:ml-auto lg:pt-6">
            <Button type="button" variant="ghost" disabled={isDefault} onClick={onReset}>
              <PiFunnelXLight className="size-4" />
              Last 30 days
            </Button>
            <Button type="submit">
              <CiSliderHorizontal className="size-4" />
              Apply range
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
