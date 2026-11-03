'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Paperclip, Upload, X } from 'lucide-react';
import { Controller, type UseFormReturn, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ACTIVITY_COPY,
  FOLLOW_UP_BY_OPTIONS,
  OUTCOME_OPTIONS,
} from '../../../_utils/activity-options';
import type { ActivityFormValues } from '../../../_utils/activity-form-schema';
import {
  FormSelectField,
  FormTextField,
  FormTextareaField,
} from '../../../_components/outreach-fields';
import { FormSection } from './form-section';

function VisitOutcome({ form }: { form: UseFormReturn<ActivityFormValues> }) {
  const outcome = useWatch({ control: form.control, name: 'outcome' });
  const needsRevisit = outcome === 'interested' || outcome === 'away';

  return (
    <FormSection highlighted title="6. Visit outcome">
      <Controller
        control={form.control}
        name="outcome"
        render={({ field }) => (
          <Field>
            <FieldLabel id="visit-outcome-label">Result</FieldLabel>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              aria-labelledby="visit-outcome-label"
              className="grid gap-2 sm:grid-cols-2"
            >
              {OUTCOME_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="has-data-checked:border-primary has-data-checked:bg-primary/5 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm font-medium"
                >
                  <RadioGroupItem value={option.value} />
                  {option.label}
                </label>
              ))}
            </RadioGroup>
          </Field>
        )}
      />
      {needsRevisit ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormTextField
            type="date"
            name="nextDate"
            label="Next visit or call"
            control={form.control}
          />
          <FormSelectField
            name="nextBy"
            label="Follow-up by"
            control={form.control}
            options={FOLLOW_UP_BY_OPTIONS}
          />
        </div>
      ) : null}
      <FormTextareaField
        name="visitNotes"
        control={form.control}
        label="Visit notes"
        placeholder="What was discussed, concerns raised, what the family wants next"
      />
      <div className="bg-muted/50 flex flex-wrap items-center justify-between gap-2 rounded-lg p-3 text-sm">
        <span>Contacts from this visit · added after saving</span>
        <Link
          href="/community-outreach/contacts/new"
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          Add person met as a contact
        </Link>
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">
        A home visit records interest only. It does not register a patient or create an MRN.
      </p>
    </FormSection>
  );
}

function Attachments({ form }: { form: UseFormReturn<ActivityFormValues> }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Controller
      control={form.control}
      name="attachments"
      render={({ field }) => (
        <Field>
          <FieldLabel>Photos or sign-in sheet</FieldLabel>
          <input
            ref={inputRef}
            multiple
            hidden
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) => {
              const added = Array.from(event.target.files ?? []).map((file) => ({
                name: file.name,
                size: file.size,
              }));

              field.onChange([
                ...field.value,
                ...added.filter((file) => !field.value.some((kept) => kept.name === file.name)),
              ]);
              event.target.value = '';
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
              <Upload />
              Attach photos or sign-in sheet
            </Button>
            <span className="text-muted-foreground text-xs">
              Kept for this session only until file storage is connected.
            </span>
          </div>
          {field.value.length > 0 ? (
            <ul className="space-y-1">
              {field.value.map((file) => (
                <li
                  key={file.name}
                  className="bg-muted/40 flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
                >
                  <Paperclip className="text-muted-foreground size-3.5" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {Math.max(1, Math.round(file.size / 1024))} KB
                  </span>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => field.onChange(field.value.filter((kept) => kept !== file))}
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </Field>
      )}
    />
  );
}

export function CompletionSection({ form }: { form: UseFormReturn<ActivityFormValues> }) {
  const type = useWatch({ control: form.control, name: 'type' });
  const status = useWatch({ control: form.control, name: 'status' });

  if (status !== 'completed') {
    return null;
  }

  if (type === 'visit') {
    return <VisitOutcome form={form} />;
  }

  const copy = ACTIVITY_COPY[type];

  return (
    <FormSection highlighted title="6. How it went">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormTextField
          name="reached"
          inputMode="numeric"
          placeholder="e.g. 120"
          control={form.control}
          label={copy.reachLabel}
        />
        <Field>
          <FieldLabel>Contacts collected</FieldLabel>
          <div className="bg-muted/50 text-muted-foreground flex min-h-9 items-center rounded-lg px-3 text-sm">
            Counted automatically · 0 so far
          </div>
        </Field>
      </div>
      <FormTextareaField
        name="summary"
        label="Summary"
        control={form.control}
        placeholder={copy.summaryPlaceholder}
      />
      <Attachments form={form} />
    </FormSection>
  );
}
