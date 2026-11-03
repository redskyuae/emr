'use client';

import { useState } from 'react';
import Link from 'next/link';
import { parseAsString, useQueryState } from 'nuqs';
import { Check } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { formatCount } from '@/lib/format-count';
import { ContactForm } from '../../../_components/contact-form';
import { useOutreach } from '../../../_components/outreach-store';
import { activityContactCount, totalContactCount } from '../../../_utils/outreach-ledger';
import {
  activityShortLabel,
  activitySourceLabel,
  staffName,
} from '../../../_utils/outreach-presentation';
import type { OutreachContact } from '../../../_utils/outreach-types';

function SavedSummary({ saved, onAddNext }: { saved: OutreachContact; onAddNext: () => void }) {
  const { state } = useOutreach();
  const activity = state.activities.find((item) => item.id === saved.activityId);

  return (
    <div role="status" className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="bg-success/10 text-success flex size-14 items-center justify-center rounded-full">
        <Check className="size-7" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold">Contact saved</h2>
      <p className="text-muted-foreground text-sm">
        {activity ? `Added to ${activityShortLabel(activity)}. ` : ''}
        {formatCount(
          activity ? activityContactCount(state, activity) : totalContactCount(state),
          'contact'
        )}{' '}
        collected.
      </p>
      <dl className="bg-muted/40 w-full space-y-2 rounded-lg border p-4 text-left text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Follow-up</dt>
          <dd className="font-medium">
            {saved.consent ? `Call by ${saved.nextShort}` : 'None · no permission'}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Assigned to</dt>
          <dd className="font-medium">{staffName(saved.staffId)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Patient record</dt>
          <dd className="font-medium">Not registered</dd>
        </div>
      </dl>
      <div className="flex w-full flex-col gap-2">
        <Button size="lg" onClick={onAddNext}>
          Add next contact
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href={`/community-outreach?tab=contacts&source=${saved.activityId}`}>
            View contacts from this activity
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function AddContactPageImpl() {
  const { state, dispatch } = useOutreach();
  const [activityId] = useQueryState('activity', parseAsString);
  const [saved, setSaved] = useState<OutreachContact | null>(null);
  const [formKey, setFormKey] = useState(0);
  const activity = state.activities.find((item) => item.id === activityId);

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/community-outreach?tab=contacts">Community Outreach</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Add contact</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Add contact</h2>
        <p className="text-muted-foreground text-sm">
          Record someone who showed interest at an outreach activity. This does not register a
          patient.
        </p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section
          aria-label="Contact details"
          className="bg-card shadow-fluent-2 min-w-0 rounded-lg border p-4"
        >
          {saved ? (
            <SavedSummary
              saved={saved}
              onAddNext={() => {
                setSaved(null);
                setFormKey((key) => key + 1);
              }}
            />
          ) : (
            <ContactForm
              wide
              key={formKey}
              mode="create"
              state={state}
              dispatch={dispatch}
              defaultActivityId={activityId}
              onSaved={(contact, addNext) => (addNext ? undefined : setSaved(contact))}
            />
          )}
        </section>

        <aside
          aria-label="About this activity"
          className="bg-card shadow-fluent-2 space-y-4 rounded-lg border p-4"
        >
          {activity ? (
            <div className="space-y-2">
              <h3 className="text-base font-semibold">{activity.title}</h3>
              <p className="text-muted-foreground text-sm">{activitySourceLabel(activity)}</p>
              <p className="text-sm">
                <span className="font-semibold tabular-nums">
                  {activityContactCount(state, activity)}
                </span>{' '}
                contacts so far
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Choose the activity this person came from. Their follow-up is assigned to its lead.
            </p>
          )}
          <ul className="text-muted-foreground space-y-2 border-t pt-3 text-xs leading-relaxed">
            <li>
              Ask before ticking “Agrees to be contacted”. Without it, no follow-up is scheduled.
            </li>
            <li>Use “Check if already a patient” to flag a record the front desk should link.</li>
            <li>Saving never registers a patient or creates a Medical Record Number.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
