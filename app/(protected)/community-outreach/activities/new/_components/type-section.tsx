'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ACTIVITY_TYPE_OPTIONS, typeDefaults } from '../../../_utils/activity-options';
import type { ActivityFormValues } from '../../../_utils/activity-form-schema';
import { FormSection } from './form-section';

export function TypeSection({ form }: { form: UseFormReturn<ActivityFormValues> }) {
  return (
    <FormSection title="1. Type of activity">
      <Controller
        control={form.control}
        name="type"
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            aria-label="Type of activity"
            className="grid gap-3 sm:grid-cols-3"
            onValueChange={(next) => {
              const type = next as ActivityFormValues['type'];
              const defaults = typeDefaults(type);

              field.onChange(type);
              form.setValue('offers', defaults.offers);
              form.setValue('staffIds', defaults.staffIds);
              form.setValue('leadId', defaults.leadId);
              form.clearErrors();
            }}
          >
            {ACTIVITY_TYPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="has-data-checked:border-primary has-data-checked:bg-primary/5 flex min-h-24 cursor-pointer flex-col gap-1.5 rounded-lg border p-3"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{option.label}</span>
                  <RadioGroupItem value={option.value} />
                </span>
                <span className="text-muted-foreground text-xs leading-relaxed">
                  {option.description}
                </span>
              </label>
            ))}
          </RadioGroup>
        )}
      />
    </FormSection>
  );
}
