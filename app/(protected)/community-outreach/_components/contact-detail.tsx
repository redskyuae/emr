'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { MessageCircle, Phone, Search, SearchX, UserRoundCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatLongDate, toIsoDate } from '../_utils/outreach-dates';
import type { OutreachAction } from '../_utils/outreach-ledger';
import { activitySourceLabel, initialsOf, staffName } from '../_utils/outreach-presentation';
import type { OutreachActivity, OutreachContact } from '../_utils/outreach-types';
import { ContactStatusBadge } from './outreach-badges';

type ContactDetailProps = {
  contact: OutreachContact;
  activity: OutreachActivity | undefined;
  dispatch: (action: OutreachAction) => void;
};

function DetailItem({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function PatientCheck({ contact, dispatch }: Pick<ContactDetailProps, 'contact' | 'dispatch'>) {
  const today = formatLongDate(toIsoDate(new Date()));
  const entry = (title: string, note: string) => ({
    id: `${contact.id}-h${contact.history.length + 1}`,
    kind: 'fu' as const,
    by: 'You',
    title,
    note,
    date: today,
  });

  if (contact.check === 'none') {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-3">
        <p className="text-muted-foreground text-sm">
          Not checked yet. Search patient records by phone number and name.
        </p>
        <Button
          variant="outline"
          onClick={() => dispatch({ type: 'contact/checked', id: contact.id })}
        >
          <Search />
          Check patient records
        </Button>
      </div>
    );
  }

  if (contact.check === 'nomatch') {
    return (
      <div className="bg-muted/50 flex gap-3 rounded-lg p-3">
        <SearchX className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium">No existing patient found</p>
          <p className="text-muted-foreground text-xs">{contact.checkedOn}</p>
        </div>
      </div>
    );
  }

  if (contact.check === 'linked' && contact.match) {
    return (
      <div className="border-procedure/30 bg-procedure/10 space-y-1 rounded-lg border p-3">
        <p className="text-procedure text-xs font-semibold uppercase">Linked to existing patient</p>
        <p className="text-sm font-semibold">
          {contact.match.name} · MRN <span className="font-mono">{contact.match.mrn}</span>
        </p>
        <p className="text-muted-foreground text-xs">{contact.match.detail}</p>
      </div>
    );
  }

  if (!contact.match) {
    return null;
  }

  return (
    <div className="border-warning/30 bg-warning/10 space-y-3 rounded-lg border p-3">
      <p className="text-warning text-xs font-semibold uppercase">Possible existing patient</p>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">
          {contact.match.name} · MRN <span className="font-mono">{contact.match.mrn}</span>
        </p>
        <p className="text-muted-foreground text-xs">{contact.match.detail}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            dispatch({
              type: 'contact/linked',
              id: contact.id,
              entry: entry(
                'Linked to existing patient',
                `MRN ${contact.match?.mrn}. No new patient record was created.`
              ),
            });
            toast.success('Linked to the existing patient record.');
          }}
        >
          <UserRoundCheck />
          Link to this patient
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            dispatch({
              type: 'contact/dismissed',
              id: contact.id,
              entry: entry(
                'Patient match dismissed',
                `Marked as a different person from ${contact.match?.name}.`
              ),
            })
          }
        >
          Not the same person
        </Button>
      </div>
    </div>
  );
}

export function ContactDetail({ contact, activity, dispatch }: ContactDetailProps) {
  const digits = contact.phone.replace(/\D/g, '');

  return (
    <Card className="shadow-fluent-4 gap-0 py-0" aria-label="Contact detail" role="region">
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initialsOf(contact.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold">{contact.name}</h2>
            <p className="text-muted-foreground text-sm tabular-nums">{contact.phone}</p>
          </div>
          <ContactStatusBadge status={contact.status} />
        </div>
        {contact.consent ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" asChild>
              <a href={`tel:+${digits}`}>
                <Phone />
                Call
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle />
                Message
              </a>
            </Button>
          </div>
        ) : (
          <p className="border-warning/30 bg-warning/10 text-warning rounded-lg border px-3 py-2 text-sm font-medium">
            Do not contact: {contact.consentText}
          </p>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-b p-4">
        <DetailItem label="Address" className="col-span-2">
          {contact.address}
        </DetailItem>
        <DetailItem label="Area of interest">
          <span className="font-medium">{contact.interest}</span>
        </DetailItem>
        <DetailItem label="Source activity">
          {activity ? (
            <Button variant="link" className="h-auto p-0 text-left whitespace-normal" asChild>
              <Link href={`/community-outreach/activities/${activity.id}`}>
                {activitySourceLabel(activity)}
              </Link>
            </Button>
          ) : (
            '—'
          )}
        </DetailItem>
        <DetailItem label="Assigned staff">
          {staffName(contact.staffId)} ·{' '}
          <Button variant="link" className="h-auto p-0 text-xs" asChild>
            <Link href={`/community-outreach/contacts/${contact.id}/reassign`}>Reassign</Link>
          </Button>
        </DetailItem>
        <DetailItem label="Next follow-up">
          <span className={cn('font-medium', contact.due && 'text-warning')}>{contact.next}</span>
        </DetailItem>
        <DetailItem label="Permission to contact" className="col-span-2">
          {contact.consent ? 'Yes' : 'No'} · {contact.consentText}
        </DetailItem>
      </dl>

      <div className="space-y-3 border-b p-4">
        <h3 className="text-sm font-semibold">Existing patient check</h3>
        <PatientCheck contact={contact} dispatch={dispatch} />
        <p className="text-muted-foreground text-xs leading-relaxed">
          Saving or linking an outreach contact never registers a patient or creates a Medical
          Record Number. New patients are registered at the front desk.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b p-4">
        <Button className="flex-1" asChild>
          <Link href={`/community-outreach/contacts/${contact.id}/follow-up`}>Log follow-up</Link>
        </Button>
        <Button variant="outline" className="flex-1" asChild>
          <Link href={`/community-outreach/contacts/${contact.id}/edit`}>Edit</Link>
        </Button>
        {contact.check !== 'linked' ? (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              dispatch({
                type: 'contact/referred',
                id: contact.id,
                entry: {
                  id: `${contact.id}-h${contact.history.length + 1}`,
                  kind: 'fu',
                  by: 'You',
                  title: 'Referred to front desk',
                  note: 'Front desk to confirm identity and register if needed.',
                  date: formatLongDate(toIsoDate(new Date())),
                },
              });
              toast.success('Referred to the front desk.');
            }}
          >
            Refer to front desk
          </Button>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Outreach &amp; follow-up history</h3>
        <ol className="space-y-4">
          {contact.history.map((entry) => (
            <li key={entry.id} className="grid grid-cols-[1rem_minmax(0,1fr)] gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  'mt-1.5 size-2.5 rounded-full border-2',
                  entry.kind === 'fu'
                    ? 'bg-primary border-primary'
                    : 'bg-card border-muted-foreground'
                )}
              />
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-xs">
                  {entry.date} · {entry.by}
                </p>
                <p className="text-sm font-medium">{entry.title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{entry.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}
