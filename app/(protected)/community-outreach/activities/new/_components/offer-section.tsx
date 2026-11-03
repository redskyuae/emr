'use client';

import { Controller, type UseFormReturn, useWatch } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  ACTIVITY_COPY,
  AUDIENCE_OPTIONS,
  DURATION_OPTIONS,
  LANGUAGE_OPTIONS,
  OFFER_OPTIONS,
  SPEAKER_OPTIONS,
} from '../../../_utils/activity-options';
import type { ActivityFormValues } from '../../../_utils/activity-form-schema';
import {
  FormSelectField,
  FormTextField,
  FormTextareaField,
} from '../../../_components/outreach-fields';
import { FormSection } from './form-section';

export function OfferSection({ form }: { form: UseFormReturn<ActivityFormValues> }) {
  const type = useWatch({ control: form.control, name: 'type' });
  const copy = ACTIVITY_COPY[type];

  return (
    <FormSection title={`5. ${copy.offerHeading}`}>
      {type === 'event' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormSelectField
            name="speaker"
            label="Speaker"
            control={form.control}
            options={SPEAKER_OPTIONS}
          />
          <FormSelectField
            name="audience"
            label="Audience"
            control={form.control}
            options={AUDIENCE_OPTIONS}
          />
          <FormSelectField
            name="language"
            label="Language"
            control={form.control}
            options={LANGUAGE_OPTIONS}
          />
          <FormTextField
            inputMode="numeric"
            control={form.control}
            placeholder="e.g. 60"
            name="expectedAudience"
            label="Expected audience"
          />
          <FormTextField
            name="organiser"
            control={form.control}
            label="Organiser contact"
            placeholder="Name and phone"
          />
          <FormSelectField
            name="duration"
            label="Session length"
            control={form.control}
            options={DURATION_OPTIONS}
          />
        </div>
      ) : null}

      {type === 'visit' ? (
        <FormTextareaField
          required
          rows={2}
          name="reason"
          control={form.control}
          label="Reason for the visit"
          placeholder="e.g. Elderly mother with knee pain, cannot travel. Family wants to know about therapy at home or OP."
        />
      ) : null}

      <Controller
        control={form.control}
        name="offers"
        render={({ field }) => (
          <Field>
            <FieldLabel id="activity-offers-label">
              {type === 'event'
                ? 'Session includes'
                : type === 'visit'
                  ? 'Topics to cover'
                  : 'Offered'}
            </FieldLabel>
            <div
              className="grid gap-2 sm:grid-cols-2"
              role="group"
              aria-labelledby="activity-offers-label"
            >
              {OFFER_OPTIONS[type].map((option) => {
                const on = field.value.includes(option.value);

                return (
                  <label
                    key={option.value}
                    className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm"
                  >
                    <Checkbox
                      checked={on}
                      onCheckedChange={() =>
                        field.onChange(
                          on
                            ? field.value.filter((value) => value !== option.value)
                            : [...field.value, option.value]
                        )
                      }
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </Field>
        )}
      />

      <FormTextareaField
        name="notes"
        control={form.control}
        label="Notes for the team"
        placeholder="Things to carry, contact person at the venue, parking…"
      />
    </FormSection>
  );
}
