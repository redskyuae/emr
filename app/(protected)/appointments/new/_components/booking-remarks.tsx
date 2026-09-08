'use client';

import { ChevronDown, MessageSquare } from 'lucide-react';
import { Controller, useFormState, type Control } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';

export function BookingRemarks({ control }: { control: Control<BookAppointmentFormValues> }) {
  const { errors } = useFormState({ control, name: 'remarks' });
  return (
    <Collapsible className="bg-card rounded-xl border">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="group h-auto w-full justify-start gap-2 p-4"
        >
          <MessageSquare className="text-muted-foreground size-4" /> Operational remarks
          <span className="text-muted-foreground text-xs font-normal">Optional</span>
          <ChevronDown className="ml-auto size-4 group-data-[state=open]:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <Controller
          control={control}
          name="remarks"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="appointment-remarks">Remarks</FieldLabel>
              <Textarea
                id="appointment-remarks"
                placeholder="Add a short note for the care team…"
                rows={2}
                {...field}
                aria-invalid={fieldState.invalid}
              />
            </Field>
          )}
        />
      </CollapsibleContent>
      {errors.remarks ? <FieldError className="px-4 pb-3" errors={[errors.remarks]} /> : null}
    </Collapsible>
  );
}
