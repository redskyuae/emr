'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Search, UserPlus, UserRoundX } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { OUTREACH_STAFF } from '../_utils/activity-options';
import { buildCallListCsv } from '../_utils/call-list-csv';
import {
  CONTACT_CHIPS,
  countByChip,
  filterContacts,
  type ContactChip,
} from '../_utils/outreach-filters';
import { totalContactCount, type OutreachAction } from '../_utils/outreach-ledger';
import {
  PATIENT_CHECK,
  activityShortLabel,
  contactActivity,
  staffName,
} from '../_utils/outreach-presentation';
import type { OutreachState } from '../_utils/outreach-types';
import { ContactDetail } from './contact-detail';
import { ContactStatusBadge } from './outreach-badges';
import { FilterSelect } from './outreach-fields';

type ContactsPanelProps = {
  state: OutreachState;
  chip: ContactChip;
  selectedId: string | null;
  activityId: string | null;
  dispatch: (action: OutreachAction) => void;
  onActivityChange: (activityId: string | null) => void;
  onChipChange: (chip: ContactChip) => void;
  onSelect: (contactId: string) => void;
};

const STAFF_OPTIONS = OUTREACH_STAFF.map((staff) => ({ value: staff.id, label: staff.name }));

function downloadCsv(csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');

  link.href = url;
  link.download = 'outreach-call-list.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function ContactsPanel({
  state,
  chip,
  selectedId,
  activityId,
  dispatch,
  onSelect,
  onChipChange,
  onActivityChange,
}: ContactsPanelProps) {
  const [query, setQuery] = useState('');
  const [staff, setStaff] = useState<string | null>(null);
  const rows = useMemo(
    () => filterContacts(state.contacts, { query, chip, staff, activityId }),
    [state.contacts, query, chip, staff, activityId]
  );
  const chipCounts = useMemo(() => countByChip(state.contacts), [state.contacts]);
  const selected = state.contacts.find((contact) => contact.id === selectedId) ?? rows[0];
  const activityOptions = state.activities.map((activity) => ({
    value: activity.id,
    label: activityShortLabel(activity),
  }));

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <section aria-label="Contact list" className="min-w-0 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <InputGroup className="bg-background shadow-fluent-2 h-9 sm:max-w-sm sm:flex-1">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, phone, area or interest"
              aria-label="Search contacts"
            />
          </InputGroup>
          <FilterSelect
            label="Assigned staff"
            allLabel="All staff"
            value={staff}
            options={STAFF_OPTIONS}
            onChange={setStaff}
          />
          <FilterSelect
            label="Activity"
            allLabel="All activities"
            value={activityId}
            options={activityOptions}
            onChange={onActivityChange}
          />
          <Button
            variant="outline"
            className="sm:ml-auto"
            onClick={() => {
              const exportable = rows.filter((contact) => contact.consent);

              downloadCsv(buildCallListCsv(rows));
              toast.success(
                `Exported ${exportable.length} contacts. Contacts who did not agree to be contacted are left out.`
              );
            }}
          >
            <Download />
            Export call list
          </Button>
          <Button asChild>
            <Link
              href={
                activityId
                  ? `/community-outreach/contacts/new?activity=${activityId}`
                  : '/community-outreach/contacts/new'
              }
            >
              <UserPlus />
              Add contact
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Contact status filter">
          {CONTACT_CHIPS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={chip === option.value ? 'default' : 'outline'}
              aria-pressed={chip === option.value}
              onClick={() => onChipChange(option.value)}
            >
              {option.label} · {chipCounts[option.value]}
            </Button>
          ))}
        </div>

        <Card className="shadow-fluent-2 gap-0 overflow-hidden py-0">
          {rows.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserRoundX />
                </EmptyMedia>
                <EmptyTitle>No contacts match this search</EmptyTitle>
                <EmptyDescription>Try another name, phone number or filter.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Name</TableHead>
                  <TableHead>Interest · source</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Next</TableHead>
                  <TableHead>Patient check</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((contact) => {
                  const activity = contactActivity(contact, state.activities);
                  const isSelected = contact.id === selected?.id;

                  return (
                    <TableRow
                      key={contact.id}
                      data-state={isSelected ? 'selected' : undefined}
                      className="cursor-pointer"
                      onClick={() => onSelect(contact.id)}
                    >
                      <TableCell className="min-w-44">
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => onSelect(contact.id)}
                          className="focus-visible:ring-ring/50 flex flex-col rounded-sm text-left outline-none focus-visible:ring-3"
                        >
                          <span className="font-medium">{contact.name}</span>
                          <span className="text-muted-foreground text-xs tabular-nums">
                            {contact.phone}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell className="min-w-44 whitespace-normal">
                        <div>{contact.interest}</div>
                        <div className="text-muted-foreground text-xs">
                          {activity ? activityShortLabel(activity) : '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ContactStatusBadge status={contact.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-normal">
                        {staffName(contact.staffId)}
                      </TableCell>
                      <TableCell
                        className={cn('text-xs', contact.due && 'text-warning font-semibold')}
                      >
                        {contact.nextShort}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-xs font-medium',
                          PATIENT_CHECK[contact.check].className
                        )}
                      >
                        {PATIENT_CHECK[contact.check].label}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
        <p className="text-muted-foreground text-xs">
          Showing {rows.length} of {totalContactCount(state)} · select a row to see details and
          history.
        </p>
      </section>

      {selected ? (
        <ContactDetail
          contact={selected}
          dispatch={dispatch}
          activity={contactActivity(selected, state.activities)}
        />
      ) : null}
    </div>
  );
}
