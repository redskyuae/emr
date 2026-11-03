'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { MapPin, Paperclip, UsersRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActivityStatusBadge, ActivityTypeBadge } from '../../../_components/outreach-badges';
import { OutreachBreadcrumb, OutreachNotFound } from '../../../_components/outreach-page-shell';
import { useOutreach } from '../../../_components/outreach-store';
import { OFFER_OPTIONS, OUTCOME_OPTIONS } from '../../../_utils/activity-options';
import { formatLongDate, formatTime, formatWeekday } from '../../../_utils/outreach-dates';
import { activityContactCount } from '../../../_utils/outreach-ledger';
import { activityLocation, staffName } from '../../../_utils/outreach-presentation';
import type { OutreachActivity } from '../../../_utils/outreach-types';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm">{children || '—'}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-card shadow-fluent-2 space-y-3 rounded-lg border p-4">
      <h3 className="text-base font-semibold">{title}</h3>
      <dl className="space-y-2">{children}</dl>
    </section>
  );
}

function TypeDetails({ activity }: { activity: OutreachActivity }) {
  if (activity.type === 'event') {
    return (
      <Section title="Session details">
        <Row label="Speaker">{activity.speaker}</Row>
        <Row label="Audience">{activity.audience}</Row>
        <Row label="Language">{activity.language}</Row>
        <Row label="Expected audience">{activity.expectedAudience}</Row>
        <Row label="Organiser contact">{activity.organiser}</Row>
        <Row label="Session length">{activity.duration}</Row>
      </Section>
    );
  }

  if (activity.type === 'visit') {
    return (
      <Section title="Household">
        <Row label="Person to meet">{activity.person}</Row>
        <Row label="Phone">{activity.personPhone}</Row>
        <Row label="Family member present">{activity.familyPresent}</Row>
        <Row label="Requested by">{activity.requestedBy}</Row>
        <Row label="Reason">{activity.reason}</Row>
      </Section>
    );
  }

  return null;
}

function Outcome({ activity }: { activity: OutreachActivity }) {
  if (activity.status !== 'completed') {
    return null;
  }

  if (activity.type === 'visit') {
    return (
      <Section title="Visit outcome">
        <Row label="Result">
          {OUTCOME_OPTIONS.find((option) => option.value === activity.outcome)?.label}
        </Row>
        <Row label="Next visit or call">
          {activity.nextDate ? `${formatLongDate(activity.nextDate)} · ${activity.nextBy}` : ''}
        </Row>
        <Row label="Visit notes">{activity.visitNotes}</Row>
      </Section>
    );
  }

  return (
    <Section title="How it went">
      <Row label="People reached">{activity.reached}</Row>
      <Row label="Summary">{activity.summary}</Row>
      <Row label="Attachments">
        {activity.attachments.length > 0 ? (
          <ul className="space-y-1">
            {activity.attachments.map((file) => (
              <li key={file.name} className="flex items-center gap-1.5">
                <Paperclip className="text-muted-foreground size-3.5" aria-hidden="true" />
                {file.name}
              </li>
            ))}
          </ul>
        ) : null}
      </Row>
    </Section>
  );
}

export function ActivityDetailPageImpl({ activityId }: { activityId: string }) {
  const { state } = useOutreach();
  const activity = state.activities.find((item) => item.id === activityId);

  if (!activity) {
    return (
      <div className="space-y-4">
        <OutreachBreadcrumb current="Activity" />
        <OutreachNotFound entity="Activity" />
      </div>
    );
  }

  const count = activityContactCount(state, activity);
  const offers = OFFER_OPTIONS[activity.type].filter((option) =>
    activity.offers.includes(option.value)
  );

  return (
    <div className="space-y-4">
      <OutreachBreadcrumb current={activity.title} />

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <ActivityTypeBadge type={activity.type} />
          <ActivityStatusBadge status={activity.status} />
        </div>
        <h2 className="text-xl font-semibold">{activity.title}</h2>
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span>
            {formatWeekday(activity.date)}, {formatLongDate(activity.date)}
            {activity.startTime ? ` · ${formatTime(activity.startTime)}` : ''}
            {activity.endTime ? ` – ${formatTime(activity.endTime)}` : ''}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden="true" />
            {activityLocation(activity)}
          </span>
        </p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          <Section title="Where">
            <Row label="Venue">{activity.venue}</Row>
            <Row label="Area / locality">{activity.area}</Row>
            <Row label="Address or landmark">{activity.address}</Row>
          </Section>

          <Section title="Staff assigned">
            <Row label="Lead">{staffName(activity.leadId)}</Row>
            <Row label="Team">{activity.staffIds.map(staffName).join(', ')}</Row>
          </Section>

          <TypeDetails activity={activity} />

          <section className="bg-card shadow-fluent-2 space-y-3 rounded-lg border p-4">
            <h3 className="text-base font-semibold">
              {activity.type === 'visit' ? 'Purpose of visit' : 'What is offered'}
            </h3>
            {offers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {offers.map((offer) => (
                  <Badge key={offer.value} variant="outline">
                    {offer.label}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nothing selected.</p>
            )}
            {activity.notes ? (
              <p className="text-muted-foreground text-sm">Notes: {activity.notes}</p>
            ) : null}
          </section>

          <Outcome activity={activity} />
        </div>

        <aside
          aria-label="Activity contacts"
          className="bg-card shadow-fluent-2 space-y-4 rounded-lg border p-4"
        >
          <h3 className="text-base font-semibold">Contacts</h3>
          <div className="bg-muted/50 flex items-center gap-2 rounded-lg p-3 text-sm">
            <UsersRound className="text-muted-foreground size-4" aria-hidden="true" />
            <span>
              Contacts from this activity · <strong className="tabular-nums">{count}</strong>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href={`/community-outreach/contacts/new?activity=${activity.id}`}>
                Add contact
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/community-outreach?tab=contacts&source=${activity.id}`}>
                View contacts
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/community-outreach">Back to activities</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
