'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormTextareaField, RequiredMark } from '../../../../_components/outreach-fields';
import {
  FOLLOW_UP_OUTCOMES,
  followUpFormSchema,
  type FollowUpFormValues,
} from '../../../../_utils/follow-up-form-schema';
import {
  addDaysIso,
  formatLongDate,
  formatShortDate,
  toIsoDate,
} from '../../../../_utils/outreach-dates';
import type { OutreachAction } from '../../../../_utils/outreach-ledger';
import type { OutreachContact } from '../../../../_utils/outreach-types';

type FollowUpFormProps = {
  onDone: () => void;
  contact: OutreachContact;
  dispatch: (action: OutreachAction) => void;
};

export function FollowUpForm({ contact, dispatch, onDone }: FollowUpFormProps) {
  const form = useForm<FollowUpFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(followUpFormSchema),
    defaultValues: {
      outcome: 'interested',
      note: '',
      nextDate: addDaysIso(toIsoDate(new Date()), 2),
    },
  });
  const outcomeValue = useWatch({ control: form.control, name: 'outcome' });
  const outcome = FOLLOW_UP_OUTCOMES.find((option) => option.value === outcomeValue)!;

  const submit = form.handleSubmit((values) => {
    const todayIso = toIsoDate(new Date());
    const nextIso = outcome.needsDate ? values.nextDate : '';

    dispatch({
      type: 'contact/followed-up',
      id: contact.id,
      status: outcome.status,
      due: nextIso !== '' && nextIso <= todayIso,
      nextShort: nextIso ? formatShortDate(nextIso) : '—',
      next: nextIso
        ? `${formatLongDate(nextIso)} · ${outcome.value === 'booked' ? 'OPD' : 'call'}`
        : 'None',
      entry: {
        id: `${contact.id}-h${contact.history.length + 1}`,
        kind: 'fu',
        by: 'You',
        title: outcome.label,
        note: values.note,
        date: formatLongDate(todayIso),
      },
    });
    toast.success(outcome.status === 'closed' ? 'Follow-up closed.' : 'Follow-up logged.');
    onDone();
  });

  return (
    <form noValidate onSubmit={submit} className="space-y-4 lg:max-w-2xl">
      <Controller
        control={form.control}
        name="outcome"
        render={({ field }) => (
          <Field>
            <FieldLabel id="follow-up-outcome-label">
              Outcome
              <RequiredMark />
            </FieldLabel>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              aria-labelledby="follow-up-outcome-label"
              className="sm:grid-cols-2"
            >
              {FOLLOW_UP_OUTCOMES.map((option) => (
                <label
                  key={option.value}
                  className="has-data-checked:border-primary has-data-checked:bg-primary/5 flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm"
                >
                  <RadioGroupItem value={option.value} />
                  {option.label}
                </label>
              ))}
            </RadioGroup>
          </Field>
        )}
      />

      <FormTextareaField control={form.control} name="note" label="Note" required rows={3} />

      {outcome.needsDate ? (
        <Controller
          control={form.control}
          name="nextDate"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="follow-up-date">
                {outcome.value === 'booked' ? 'Appointment date' : 'Next follow-up'}
                <RequiredMark />
              </FieldLabel>
              <Input
                id="follow-up-date"
                type="date"
                {...field}
                aria-required={true}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error ? (
                <p className="text-destructive text-xs">{fieldState.error.message}</p>
              ) : null}
            </Field>
          )}
        />
      ) : null}

      <div className="flex flex-col gap-2 pt-1 md:flex-row-reverse md:justify-end">
        <Button type="submit" size="lg">
          Save follow-up
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
