'use client';

import { useState } from 'react';
import Link from 'next/link';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CONTACT_CHIP_VALUES } from '../_utils/outreach-filters';
import { totalContactCount } from '../_utils/outreach-ledger';
import { ActivitiesPanel } from './activities-panel';
import { ContactsPanel } from './contacts-panel';
import { OutreachSummary } from './outreach-summary';
import { useOutreach } from './outreach-store';

const queryParsers = {
  source: parseAsString,
  selected: parseAsString,
  tab: parseAsStringLiteral(['activities', 'contacts'] as const).withDefault('activities'),
  chip: parseAsStringLiteral(CONTACT_CHIP_VALUES).withDefault('all'),
};

export function OutreachPageImpl() {
  const { state, dispatch } = useOutreach();
  const [today] = useState(() => new Date());
  const [params, setParams] = useQueryStates(queryParsers);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Wellness camps, awareness events and home visits, and the people who showed interest.
        </p>
        {params.tab === 'activities' ? (
          <Button variant="outline" asChild>
            <Link href="/community-outreach/contacts/new">
              <UserPlus />
              Add contact
            </Link>
          </Button>
        ) : null}
      </div>

      <OutreachSummary state={state} today={today} />

      <Tabs
        value={params.tab}
        onValueChange={(tab) => setParams({ tab: tab as 'activities' | 'contacts' })}
      >
        <TabsList variant="line" className="h-10 border-b">
          <TabsTrigger value="activities" className="px-4">
            Activities
            <span className="text-muted-foreground tabular-nums">{state.activities.length}</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="px-4">
            Contacts
            <span className="text-muted-foreground tabular-nums">{totalContactCount(state)}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="pt-3">
          <ActivitiesPanel state={state} />
        </TabsContent>
        <TabsContent value="contacts" className="pt-3">
          <ContactsPanel
            state={state}
            dispatch={dispatch}
            chip={params.chip}
            activityId={params.source}
            selectedId={params.selected}
            onActivityChange={(source) => setParams({ source })}
            onChipChange={(chip) => setParams({ chip })}
            onSelect={(selected) => setParams({ selected })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
