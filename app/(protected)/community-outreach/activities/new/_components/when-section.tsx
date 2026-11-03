'use client';

import { Controller, type UseFormReturn, useWatch } from 'react-hook-form';

import { Field, FieldLabel } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ACTIVITY_COPY } from '../../../_utils/activity-options';
import type { ActivityFormValues } from '../../../_utils/activity-form-schema';
import { FormTextField } from '../../../_components/outreach-fields';
import { FormSection } from './form-section';

export function WhenSection({ form }: { form: UseFormReturn<ActivityFormValues> }) {
  const type = useWatch({ control: form.control, name: 'type' });

  return (
    <FormSection title="2. When">
      <Controller
        control={form.control}
        name="status"
        render={({ field }) => (
          <Field>
            <FieldLabel id="activity-status-label">Status</FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              value={field.value}
              aria-labelledby="activity-status-label"
              onValueChange={(next) => next && field.onChange(next)}
            >
              <ToggleGroupItem value="planned">Planned (upcoming)</ToggleGroupItem>
              <ToggleGroupItem value="completed">Completed</ToggleGroupItem>
            </ToggleGroup>
          </Field>
        )}
      />
      <FormTextField
        required
        name="title"
        label="Title"
        control={form.control}
        placeholder={ACTIVITY_COPY[type].titlePlaceholder}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <FormTextField required type="date" name="date" label="Date" control={form.control} />
        <FormTextField type="time" name="startTime" label="Start time" control={form.control} />
        <FormTextField type="time" name="endTime" label="End time" control={form.control} />
      </div>
    </FormSection>
  );
}
