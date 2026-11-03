'use client';

import { UseFormReturn, useWatch } from 'react-hook-form';

import { ACTIVITY_COPY, REQUESTED_BY_OPTIONS } from '../../../_utils/activity-options';
import type { ActivityFormValues } from '../../../_utils/activity-form-schema';
import { FormSelectField, FormTextField } from '../../../_components/outreach-fields';
import { FormSection } from './form-section';

export function WhereSection({ form }: { form: UseFormReturn<ActivityFormValues> }) {
  const type = useWatch({ control: form.control, name: 'type' });
  const copy = ACTIVITY_COPY[type];

  return (
    <FormSection title={`3. ${copy.whereHeading}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormTextField
          required
          name="venue"
          control={form.control}
          label={copy.venueLabel}
          placeholder={copy.venuePlaceholder}
        />
        <FormTextField
          required
          name="area"
          control={form.control}
          label="Area / locality"
          placeholder="e.g. Thrikkakara"
        />
      </div>
      <FormTextField
        name="address"
        control={form.control}
        label="Address or landmark (optional)"
        placeholder="Helps staff find the place on the day"
      />
      {type === 'visit' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormTextField
            required
            name="person"
            label="Person to meet"
            control={form.control}
            placeholder="e.g. Kunjamma Thomas, 72"
          />
          <FormTextField
            required
            type="tel"
            name="personPhone"
            control={form.control}
            placeholder="10-digit mobile"
            label="Phone to confirm the visit"
          />
          <FormTextField
            name="familyPresent"
            control={form.control}
            label="Family member present"
            placeholder="e.g. Son, Biju Thomas"
          />
          <FormSelectField
            name="requestedBy"
            control={form.control}
            label="Visit requested by"
            options={REQUESTED_BY_OPTIONS}
          />
        </div>
      ) : null}
    </FormSection>
  );
}
