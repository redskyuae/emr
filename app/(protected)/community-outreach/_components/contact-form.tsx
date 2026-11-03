'use client';

import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import {
  INTEREST_OPTIONS,
  contactFormSchema,
  type ContactFormValues,
} from '../_utils/contact-form-schema';
import { toIsoDate } from '../_utils/outreach-dates';
import {
  buildContact,
  findPatientByPhone,
  nextId,
  type OutreachAction,
} from '../_utils/outreach-ledger';
import { activityShortLabel, staffName } from '../_utils/outreach-presentation';
import type { OutreachContact, OutreachState, PatientMatch } from '../_utils/outreach-types';
import { FormSelectField, FormTextField, FormTextareaField, RequiredMark } from './outreach-fields';

type ContactFormProps = {
  wide?: boolean;
  state: OutreachState;
  dispatch: (action: OutreachAction) => void;
} & (
  | {
      mode: 'create';
      defaultActivityId: string | null;
      onSaved: (contact: OutreachContact, addNext: boolean) => void;
    }
  | { mode: 'edit'; contact: OutreachContact; onSaved: () => void; onCancel: () => void }
);

type PatientLookup =
  { status: 'idle' } | { status: 'none' } | { status: 'match'; match: PatientMatch };

function emptyValues(activityId: string): ContactFormValues {
  return {
    name: '',
    phone: '',
    address: '',
    interests: ['consult'],
    notes: '',
    consent: true,
    activityId,
  };
}

function valuesFor(contact: OutreachContact): ContactFormValues {
  return {
    name: contact.name,
    phone: contact.phone.replace(/\D/g, '').slice(-10),
    address: contact.address === 'Not given' ? '' : contact.address,
    interests: contact.interests,
    notes: contact.notes,
    consent: contact.consent,
    activityId: contact.activityId,
  };
}

export function ContactForm(props: ContactFormProps) {
  const { state, dispatch, wide } = props;
  const editing = props.mode === 'edit';
  const [lookup, setLookup] = useState<PatientLookup>({ status: 'idle' });
  const form = useForm<ContactFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(contactFormSchema),
    defaultValues: editing
      ? valuesFor(props.contact)
      : emptyValues(props.defaultActivityId ?? state.activities[0]?.id ?? ''),
  });
  const consent = useWatch({ control: form.control, name: 'consent' });

  function save(addNext: boolean) {
    return form.handleSubmit((values) => {
      const todayIso = toIsoDate(new Date());

      if (props.mode === 'edit') {
        dispatch({ type: 'contact/updated', id: props.contact.id, values, todayIso });
        toast.success('Contact updated.');
        props.onSaved();
        return;
      }

      const activity = state.activities.find((item) => item.id === values.activityId);

      if (!activity) {
        form.setError('activityId', { message: 'Choose the activity this contact came from.' });
        return;
      }

      const contact = buildContact(values, activity, todayIso, nextId('c', state.contacts));

      dispatch({ type: 'contact/added', contact });
      toast.success(
        values.consent
          ? `Contact saved. Follow-up: call by ${contact.nextShort}.`
          : 'Contact saved. No follow-up: permission to contact was not given.',
        {
          description: `Added to ${activityShortLabel(activity)}. Assigned to ${staffName(activity.leadId)}.`,
        }
      );

      if (addNext) {
        form.reset({ ...emptyValues(values.activityId), consent: false });
        setLookup({ status: 'idle' });
      }

      props.onSaved(contact, addNext);
    })();
  }

  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="space-y-4">
      <FieldGroup
        className={cn(
          wide &&
            'md:grid md:grid-cols-2 md:gap-x-4 md:gap-y-6 md:*:col-span-2 md:[&>:nth-child(2)]:col-span-1 md:[&>:nth-child(3)]:col-span-1'
        )}
      >
        <FormSelectField
          required
          name="activityId"
          label="Activity"
          disabled={editing}
          control={form.control}
          hint={editing ? 'The source activity cannot be changed.' : undefined}
          options={state.activities.map((activity) => ({
            value: activity.id,
            label: `${activityShortLabel(activity)} · ${activity.title}`,
          }))}
        />

        <FormTextField
          required
          name="name"
          label="Name"
          autoComplete="name"
          control={form.control}
          placeholder="Full name"
        />

        <div className="space-y-2">
          <Controller
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="outreach-contact-phone">
                  Phone number
                  <RequiredMark />
                </FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>+91</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="outreach-contact-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="10-digit mobile"
                    {...field}
                    onChange={(event) => {
                      setLookup({ status: 'idle' });
                      field.onChange(event);
                    }}
                    aria-required={true}
                    aria-invalid={fieldState.invalid}
                  />
                </InputGroup>
                {fieldState.error ? (
                  <p className="text-destructive text-xs">{fieldState.error.message}</p>
                ) : null}
              </Field>
            )}
          />
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={() => {
              const match = findPatientByPhone(form.getValues('phone'));

              setLookup(match ? { status: 'match', match } : { status: 'none' });
            }}
          >
            <Search />
            Check if already a patient
          </Button>
          {lookup.status === 'match' ? (
            <div
              role="status"
              className="border-warning/30 bg-warning/10 space-y-1 rounded-lg border p-3"
            >
              <p className="text-sm font-semibold">1 patient record has this number</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {lookup.match.name} · MRN ending {lookup.match.mrn.slice(-4)}. Save as a contact
                anyway; the desk confirms and links it later.
              </p>
            </div>
          ) : null}
          {lookup.status === 'none' ? (
            <p role="status" className="text-muted-foreground text-xs">
              No patient record has this number.
            </p>
          ) : null}
        </div>

        <FormTextField
          name="address"
          autoComplete="street-address"
          control={form.control}
          label="Address (optional)"
          placeholder="House, street or locality"
        />

        <Controller
          control={form.control}
          name="interests"
          render={({ field }) => (
            <Field>
              <FieldLabel id="outreach-interest-label">
                Area of interest{' '}
                <span className="text-muted-foreground font-normal">(choose any)</span>
              </FieldLabel>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-labelledby="outreach-interest-label"
              >
                {INTEREST_OPTIONS.map((option) => {
                  const on = field.value.includes(option.value);

                  return (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant={on ? 'default' : 'outline'}
                      aria-pressed={on}
                      onClick={() =>
                        field.onChange(
                          on
                            ? field.value.filter((value) => value !== option.value)
                            : [...field.value, option.value]
                        )
                      }
                    >
                      {on ? <Check /> : null}
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </Field>
          )}
        />

        <FormTextareaField
          name="notes"
          label="Notes"
          control={form.control}
          placeholder="Concern, best time to call, family member interested…"
        />

        <Controller
          control={form.control}
          name="consent"
          render={({ field }) => (
            <label
              className={cn(
                'bg-card flex cursor-pointer items-start gap-3 rounded-lg border p-3',
                field.value && 'border-primary'
              )}
            >
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                className="mt-0.5"
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-semibold">Agrees to be contacted</span>
                <span className="text-muted-foreground block text-xs leading-relaxed">
                  By phone or WhatsApp about consultations, therapies and wellness programs. Ask
                  before ticking.
                </span>
              </span>
            </label>
          )}
        />
      </FieldGroup>

      <div className={cn('flex flex-col gap-2 pt-1', wide && 'md:flex-row-reverse md:justify-end')}>
        {props.mode === 'create' ? (
          <>
            <Button type="button" size="lg" onClick={() => save(true)}>
              Save &amp; add next
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={() => save(false)}>
              Save and close
            </Button>
          </>
        ) : (
          <>
            <Button type="button" size="lg" onClick={() => save(false)}>
              Save changes
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={props.onCancel}>
              Cancel
            </Button>
          </>
        )}
      </div>
      <p className="text-muted-foreground text-center text-xs leading-relaxed">
        Saved as an outreach contact only. This does not register a patient or create an MRN.
        {consent ? '' : ' No follow-up is scheduled without permission.'}
      </p>
    </form>
  );
}
