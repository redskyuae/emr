'use client';

import { Controller, type UseFormReturn, useWatch } from 'react-hook-form';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { OUTREACH_STAFF } from '../../../_utils/activity-options';
import type { ActivityFormValues } from '../../../_utils/activity-form-schema';
import { FormSelectField } from '../../../_components/outreach-fields';
import { FormSection } from './form-section';

export function StaffSection({ form }: { form: UseFormReturn<ActivityFormValues> }) {
  const staffIds = useWatch({ control: form.control, name: 'staffIds' });

  return (
    <FormSection title="4. Staff assigned">
      <p className="text-muted-foreground text-sm">
        Assigned staff see this activity on their phone and can add contacts to it.
      </p>
      <Controller
        control={form.control}
        name="staffIds"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel id="activity-staff-label" className="sr-only">
              Staff assigned
            </FieldLabel>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-labelledby="activity-staff-label"
            >
              {OUTREACH_STAFF.map((person) => {
                const on = field.value.includes(person.id);

                return (
                  <Button
                    key={person.id}
                    type="button"
                    variant="outline"
                    aria-pressed={on}
                    className={
                      on ? 'border-primary bg-primary/10 h-11 gap-2 pl-1.5' : 'h-11 gap-2 pl-1.5'
                    }
                    onClick={() => {
                      const next = on
                        ? field.value.filter((id) => id !== person.id)
                        : [...field.value, person.id];

                      field.onChange(next);

                      if (!next.includes(form.getValues('leadId'))) {
                        form.setValue('leadId', next[0] ?? '');
                      }
                    }}
                  >
                    <Avatar className="size-8">
                      <AvatarFallback
                        className={on ? 'bg-primary text-primary-foreground text-xs' : 'text-xs'}
                      >
                        {person.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex flex-col items-start leading-tight">
                      <span>{person.name}</span>
                      <span className="text-muted-foreground text-xs font-normal">
                        {person.role}
                      </span>
                    </span>
                  </Button>
                );
              })}
            </div>
            {fieldState.error ? (
              <p className="text-destructive text-xs">{fieldState.error.message}</p>
            ) : null}
          </Field>
        )}
      />
      <div className="max-w-xs">
        <FormSelectField
          name="leadId"
          control={form.control}
          label="Lead for this activity"
          options={OUTREACH_STAFF.filter((person) => staffIds.includes(person.id)).map(
            (person) => ({
              value: person.id,
              label: person.name,
            })
          )}
        />
      </div>
    </FormSection>
  );
}
