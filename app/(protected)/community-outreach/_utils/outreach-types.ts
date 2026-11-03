import type { ActivityFormValues } from './activity-form-schema';

export type ActivityType = ActivityFormValues['type'];

export type ActivityStatus = ActivityFormValues['status'];

export type ContactStatus =
  'new' | 'tocall' | 'contacted' | 'sched' | 'booked' | 'linked' | 'closed';

export type PatientCheck = 'none' | 'nomatch' | 'match' | 'linked';

export type OutreachActivity = ActivityFormValues & {
  id: string;
  baseContacts: number;
  baseDeclined: number;
};

export type PatientMatch = {
  mrn: string;
  name: string;
  detail: string;
};

export type ContactHistoryEntry = {
  id: string;
  by: string;
  note: string;
  date: string;
  title: string;
  kind: 'out' | 'fu';
};

export type OutreachContact = {
  id: string;
  name: string;
  phone: string;
  area: string;
  next: string;
  due: boolean;
  consent: boolean;
  notes: string;
  address: string;
  staffId: string;
  interests: string[];
  nextShort: string;
  interest: string;
  checkedOn: string;
  activityId: string;
  consentText: string;
  status: ContactStatus;
  check: PatientCheck;
  addedInSession: boolean;
  history: ContactHistoryEntry[];
  match: PatientMatch | null;
  result: 'match' | 'nomatch' | null;
};

export type OutreachState = {
  activities: OutreachActivity[];
  contacts: OutreachContact[];
};
