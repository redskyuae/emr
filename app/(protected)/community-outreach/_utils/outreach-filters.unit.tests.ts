import { describe, expect, it } from 'vitest';

import { SEED_STATE } from '../_data/outreach-seed';
import {
  countByChip,
  filterActivities,
  filterContacts,
  type ActivityFilters,
  type ContactFilters,
} from './outreach-filters';

const today = new Date(2026, 10, 2);

const noActivityFilters: ActivityFilters = { query: '', type: null, staff: null, range: 'all' };
const noContactFilters: ContactFilters = { query: '', chip: 'all', staff: null, activityId: null };

describe('filterActivities', () => {
  it('should return every activity when no filter is set', () => {
    expect(filterActivities(SEED_STATE.activities, noActivityFilters, today)).toHaveLength(7);
  });

  it('should filter by activity type and assigned staff', () => {
    const rows = filterActivities(
      SEED_STATE.activities,
      { ...noActivityFilters, type: 'camp', staff: 'anil' },
      today
    );

    expect(rows.map((row) => row.id)).toEqual(['a1', 'a3', 'a6']);
  });

  it('should search the title, location and staff names', () => {
    const search = (query: string) =>
      filterActivities(SEED_STATE.activities, { ...noActivityFilters, query }, today).map(
        (row) => row.id
      );

    expect(search('monsoon')).toEqual(['a4']);
    expect(search('vyttila')).toEqual(['a7']);
    expect(search('rahul')).toEqual(['a2', 'a5']);
  });

  it('should keep upcoming activities inside a trailing date range', () => {
    const rows = filterActivities(
      SEED_STATE.activities,
      { ...noActivityFilters, range: '30' },
      today
    );

    expect(rows.map((row) => row.id)).toEqual(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7']);
  });
});

describe('filterContacts', () => {
  it('should list contacts due today', () => {
    const rows = filterContacts(SEED_STATE.contacts, { ...noContactFilters, chip: 'today' });

    expect(rows.map((row) => row.id)).toEqual(['c3', 'c7', 'c8']);
  });

  it('should combine the activity filter with a search term', () => {
    const rows = filterContacts(SEED_STATE.contacts, {
      ...noContactFilters,
      activityId: 'a3',
      query: 'acidity',
    });

    expect(rows).toHaveLength(0);
    expect(
      filterContacts(SEED_STATE.contacts, {
        ...noContactFilters,
        activityId: 'a3',
        query: 'digest',
      })
    ).toHaveLength(1);
  });

  it('should search by phone number', () => {
    const rows = filterContacts(SEED_STATE.contacts, { ...noContactFilters, query: '98470' });

    expect(rows.map((row) => row.name)).toEqual(['Sreeja Varghese']);
  });
});

describe('countByChip', () => {
  it('should count contacts for each status chip', () => {
    expect(countByChip(SEED_STATE.contacts)).toEqual({
      all: 8,
      today: 3,
      new: 3,
      sched: 3,
      linked: 1,
    });
  });
});
