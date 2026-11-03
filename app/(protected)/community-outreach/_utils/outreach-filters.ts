import { addDaysIso, toIsoDate } from './outreach-dates';
import { activityLocation, staffName } from './outreach-presentation';
import type { ActivityType, OutreachActivity, OutreachContact } from './outreach-types';

export type DateRange = 'all' | '30' | 'month' | '90';

export const CONTACT_CHIP_VALUES = ['all', 'today', 'new', 'sched', 'linked'] as const;

export type ContactChip = (typeof CONTACT_CHIP_VALUES)[number];

export type ActivityFilters = {
  query: string;
  staff: string | null;
  range: DateRange;
  type: ActivityType | null;
};

export type ContactFilters = {
  query: string;
  chip: ContactChip;
  staff: string | null;
  activityId: string | null;
};

export const DATE_RANGE_OPTIONS: Array<{ value: DateRange; label: string }> = [
  { value: 'all', label: 'All dates' },
  { value: '30', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
  { value: '90', label: 'Last 90 days' },
];

export const CONTACT_CHIPS: Array<{ value: ContactChip; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Due today' },
  { value: 'new', label: 'New & to call' },
  { value: 'sched', label: 'In follow-up' },
  { value: 'linked', label: 'Linked to patient' },
];

function inDateRange(iso: string, range: DateRange, today: Date) {
  if (range === 'all') {
    return true;
  }

  const todayIso = toIsoDate(today);

  if (range === 'month') {
    return iso.slice(0, 7) === todayIso.slice(0, 7);
  }

  return iso >= addDaysIso(todayIso, -Number(range));
}

export function filterActivities(
  activities: OutreachActivity[],
  filters: ActivityFilters,
  today: Date
) {
  const query = filters.query.trim().toLowerCase();

  return activities.filter((activity) => {
    if (filters.type && activity.type !== filters.type) {
      return false;
    }

    if (filters.staff && !activity.staffIds.includes(filters.staff)) {
      return false;
    }

    if (!inDateRange(activity.date, filters.range, today)) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      activity.title,
      activityLocation(activity),
      ...activity.staffIds.map(staffName),
    ];

    return haystack.join(' ').toLowerCase().includes(query);
  });
}

export function matchesChip(contact: OutreachContact, chip: ContactChip) {
  switch (chip) {
    case 'today':
      return contact.due;
    case 'new':
      return contact.status === 'new' || contact.status === 'tocall';
    case 'sched':
      return ['sched', 'booked', 'contacted'].includes(contact.status);
    case 'linked':
      return contact.status === 'linked';
    default:
      return true;
  }
}

export function filterContacts(contacts: OutreachContact[], filters: ContactFilters) {
  const query = filters.query.trim().toLowerCase();

  return contacts.filter((contact) => {
    if (!matchesChip(contact, filters.chip)) {
      return false;
    }

    if (filters.staff && contact.staffId !== filters.staff) {
      return false;
    }

    if (filters.activityId && contact.activityId !== filters.activityId) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      contact.name,
      contact.phone,
      contact.area,
      contact.interest,
      staffName(contact.staffId),
    ];

    return haystack.join(' ').toLowerCase().includes(query);
  });
}

export function countByChip(contacts: OutreachContact[]) {
  return Object.fromEntries(
    CONTACT_CHIPS.map(({ value }) => [value, contacts.filter((c) => matchesChip(c, value)).length])
  ) as Record<ContactChip, number>;
}
