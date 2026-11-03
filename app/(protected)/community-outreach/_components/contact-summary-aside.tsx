import type { ReactNode } from 'react';
import Link from 'next/link';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  activitySourceLabel,
  contactActivity,
  initialsOf,
  staffName,
} from '../_utils/outreach-presentation';
import type { OutreachActivity, OutreachContact } from '../_utils/outreach-types';
import { ContactStatusBadge } from './outreach-badges';

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export function ContactSummaryAside({
  contact,
  activities,
}: {
  contact: OutreachContact;
  activities: OutreachActivity[];
}) {
  const activity = contactActivity(contact, activities);

  return (
    <aside
      aria-label="Contact summary"
      className="bg-card shadow-fluent-2 space-y-4 rounded-lg border p-4"
    >
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initialsOf(contact.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{contact.name}</p>
          <p className="text-muted-foreground text-sm tabular-nums">{contact.phone}</p>
        </div>
      </div>
      <ContactStatusBadge status={contact.status} />
      <dl className="grid gap-3 border-t pt-3">
        <Item label="Source activity">
          {activity ? (
            <Link
              href={`/community-outreach/activities/${activity.id}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {activitySourceLabel(activity)}
            </Link>
          ) : (
            '—'
          )}
        </Item>
        <Item label="Assigned staff">{staffName(contact.staffId)}</Item>
        <Item label="Next follow-up">
          <span className={cn('font-medium', contact.due && 'text-warning')}>{contact.next}</span>
        </Item>
        <Item label="Permission to contact">
          {contact.consent ? 'Yes' : 'No'} · {contact.consentText}
        </Item>
      </dl>
    </aside>
  );
}
