'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CiSearch, CiSliderHorizontal } from 'react-icons/ci';
import { PiFunnelXLight } from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  userAuditFilterFormSchema,
  type UserAuditFilterFormValues,
} from '../_utils/user-audit-filter-form-schema';

export function UserAuditFilterForm({
  applied,
  activeCount,
  onApply,
  onReset,
}: {
  applied: UserAuditFilterFormValues;
  activeCount: number;
  onApply: (values: UserAuditFilterFormValues) => void;
  onReset: () => void;
}) {
  const form = useForm<UserAuditFilterFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(userAuditFilterFormSchema),
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

  // Back/forward navigation and Reset change the applied filters from outside the form.
  const appliedKey = JSON.stringify(applied);
  useEffect(() => {
    reset(JSON.parse(appliedKey) as UserAuditFilterFormValues);
  }, [appliedKey, reset]);

  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <form
          noValidate
          aria-label="User Audit filters"
          className="space-y-4"
          onSubmit={handleSubmit((values) => onApply({ ...values, query: values.query.trim() }))}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field className="sm:col-span-2" data-invalid={!!errors.query}>
              <FieldLabel htmlFor="user-audit-search">Search</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <CiSearch className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="user-audit-search"
                  type="search"
                  placeholder="Name, email or staff code"
                  aria-invalid={!!errors.query}
                  {...register('query')}
                />
              </InputGroup>
              <FieldError errors={[errors.query]} />
            </Field>

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
