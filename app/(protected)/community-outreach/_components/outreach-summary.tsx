import type { ReactNode } from 'react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { formatCount } from '@/lib/format-count';
import { addDaysIso, toIsoDate } from '../_utils/outreach-dates';
import { consentedContactCount, totalContactCount } from '../_utils/outreach-ledger';
import type { OutreachState } from '../_utils/outreach-types';

function StatCard({
  label,
  value,
  children,
}: {
  label: string;
  value: number;
  children: ReactNode;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="space-y-1 p-4">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="font-heading text-3xl font-bold tabular-nums">{value}</p>
        <div className="text-muted-foreground text-xs">{children}</div>
      </CardContent>
    </Card>
  );
}

export function OutreachSummary({ state, today }: { state: OutreachState; today: Date }) {
  const todayIso = toIsoDate(today);
  const windowStart = addDaysIso(todayIso, -30);
  const recent = state.activities.filter(
    (activity) =>
      activity.status === 'completed' && activity.date >= windowStart && activity.date <= todayIso
  );
  const countOf = (type: string) => recent.filter((activity) => activity.type === type).length;
  const dueToday = state.contacts.filter((contact) => contact.due).length;
  const linked = state.contacts.filter((contact) => contact.check === 'linked').length;

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard label="Activities, last 30 days" value={recent.length}>
        {formatCount(countOf('camp'), 'camp')} · {formatCount(countOf('event'), 'event')} ·{' '}
        {formatCount(countOf('visit'), 'home visit')}
      </StatCard>
      <StatCard label="Contacts collected" value={totalContactCount(state)}>
        {consentedContactCount(state)} agreed to be contacted
      </StatCard>
      <StatCard label="Follow-ups due today" value={dueToday}>
        <Link
          href="/community-outreach?tab=contacts&chip=today"
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          Open call list
        </Link>
      </StatCard>
      <StatCard label="Linked to existing patients" value={linked}>
        Matched by staff, never auto-registered
      </StatCard>
    </div>
  );
}
