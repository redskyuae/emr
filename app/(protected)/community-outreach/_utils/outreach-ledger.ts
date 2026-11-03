import { PATIENT_DIRECTORY } from '../_data/outreach-seed';
import type { ActivityFormValues } from './activity-form-schema';
import type { ContactFormValues } from './contact-form-schema';
import { INTEREST_OPTIONS } from './contact-form-schema';
import { addDaysIso, formatLongDate, formatShortDate } from './outreach-dates';
import { activitySourceLabel, staffName } from './outreach-presentation';
import type {
  ContactHistoryEntry,
  ContactStatus,
  OutreachActivity,
  OutreachContact,
  OutreachState,
  PatientMatch,
} from './outreach-types';

export type OutreachAction =
  | { type: 'activity/added'; activity: OutreachActivity }
  | { type: 'contact/added'; contact: OutreachContact }
  | { type: 'contact/checked'; id: string }
  | { type: 'contact/updated'; id: string; values: ContactFormValues; todayIso: string }
  | { type: 'contact/reassigned'; id: string; staffId: string; entry: ContactHistoryEntry }
  | { type: 'contact/linked'; id: string; entry: ContactHistoryEntry }
  | { type: 'contact/dismissed'; id: string; entry: ContactHistoryEntry }
  | { type: 'contact/referred'; id: string; entry: ContactHistoryEntry }
  | {
      type: 'contact/followed-up';
      id: string;
      next: string;
      due: boolean;
      nextShort: string;
      status: ContactStatus;
      entry: ContactHistoryEntry;
    };

export function findPatientByPhone(phone: string): PatientMatch | null {
  const digits = phone.replace(/\D/g, '').slice(-10);

  if (digits.length !== 10) {
    return null;
  }

  return PATIENT_DIRECTORY.find((patient) => patient.phone === digits) ?? null;
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '').slice(-10);

  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export function buildActivity(values: ActivityFormValues, id: string): OutreachActivity {
  return { ...values, id, baseContacts: 0, baseDeclined: 0 };
}

export function buildContact(
  values: ContactFormValues,
  activity: OutreachActivity,
  todayIso: string,
  id: string
): OutreachContact {
  const followUpIso = addDaysIso(todayIso, 2);
  const match = findPatientByPhone(values.phone);

  return {
    id,
    match,
    check: 'none',
    notes: values.notes,
    interests: values.interests,
    due: false,
    status: 'new',
    addedInSession: true,
    area: activity.area,
    consent: values.consent,
    activityId: activity.id,
    name: values.name.trim(),
    staffId: activity.leadId,
    phone: formatPhone(values.phone),
    address: values.address || 'Not given',
    result: match ? 'match' : 'nomatch',
    interest: interestLabels(values.interests),
    next: values.consent ? `${formatLongDate(followUpIso)} · call` : 'None · no permission',
    nextShort: values.consent ? formatShortDate(followUpIso) : '—',
    checkedOn: '',
    consentText: values.consent
      ? `Agreed at ${activity.type === 'visit' ? 'home visit' : activity.type}, ${formatShortDate(todayIso)}`
      : `did not agree to be contacted, ${formatShortDate(todayIso)}`,
    history: [
      {
        id: `${id}-h1`,
        kind: 'out',
        by: staffName(activity.leadId),
        title: `Added at ${activitySourceLabel(activity)}`,
        note: values.notes || 'No notes recorded.',
        date: formatLongDate(todayIso),
      },
    ],
  };
}

export function activityContactCount(state: OutreachState, activity: OutreachActivity) {
  const added = state.contacts.filter(
    (contact) => contact.addedInSession && contact.activityId === activity.id
  ).length;

  return activity.baseContacts + added;
}

export function consentedContactCount(state: OutreachState) {
  const declined =
    state.activities.reduce((total, activity) => total + activity.baseDeclined, 0) +
    state.contacts.filter((contact) => contact.addedInSession && !contact.consent).length;

  return totalContactCount(state) - declined;
}

export function applyContactEdit(
  contact: OutreachContact,
  values: ContactFormValues,
  todayIso: string
): OutreachContact {
  const phone = formatPhone(values.phone);
  const phoneChanged = phone !== contact.phone;
  const interestsChanged =
    [...values.interests].sort().join() !== [...contact.interests].sort().join();
  const consentChanged = values.consent !== contact.consent;
  const match = phoneChanged ? findPatientByPhone(values.phone) : contact.match;
  const unlinked = contact.check !== 'linked' && phoneChanged;

  return {
    ...contact,
    phone,
    match,
    notes: values.notes,
    consent: values.consent,
    interests: values.interests,
    name: values.name.trim(),
    address: values.address || 'Not given',
    interest: interestsChanged ? interestLabels(values.interests) : contact.interest,
    check: unlinked ? 'none' : contact.check,
    checkedOn: unlinked ? '' : contact.checkedOn,
    result: unlinked ? (match ? 'match' : 'nomatch') : contact.result,
    ...(consentChanged
      ? {
          due: values.consent ? contact.due : false,
          next: values.consent ? contact.next : 'None · no permission',
          nextShort: values.consent ? contact.nextShort : '—',
          consentText: values.consent
            ? `Agreed, updated ${formatShortDate(todayIso)}`
            : `asked not to be contacted, ${formatShortDate(todayIso)}`,
        }
      : {}),
    history: [
      {
        id: `${contact.id}-h${contact.history.length + 1}`,
        kind: 'fu',
        by: 'You',
        title: 'Contact details edited',
        note: 'Updated the details recorded for this contact.',
        date: formatLongDate(todayIso),
      },
      ...contact.history,
    ],
  };
}

export function totalContactCount(state: OutreachState) {
  return state.activities.reduce(
    (total, activity) => total + activityContactCount(state, activity),
    0
  );
}

export function nextId(prefix: string, existing: Array<{ id: string }>) {
  const highest = existing.reduce((max, item) => {
    const suffix = Number(item.id.replace(/^\D+/, ''));

    return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
  }, 0);

  return `${prefix}${highest + 1}`;
}

function interestLabels(keys: string[]) {
  return (
    INTEREST_OPTIONS.filter((option) => keys.includes(option.value))
      .map((option) => option.label)
      .join(', ') || 'Not specified'
  );
}

function updateContact(
  state: OutreachState,
  id: string,
  change: (contact: OutreachContact) => OutreachContact
): OutreachState {
  return {
    ...state,
    contacts: state.contacts.map((contact) => (contact.id === id ? change(contact) : contact)),
  };
}

function withEntry(contact: OutreachContact, entry: ContactHistoryEntry) {
  return [entry, ...contact.history];
}

export function outreachReducer(state: OutreachState, action: OutreachAction): OutreachState {
  switch (action.type) {
    case 'activity/added':
      return { ...state, activities: [action.activity, ...state.activities] };
    case 'contact/added':
      return { ...state, contacts: [action.contact, ...state.contacts] };
    case 'contact/checked':
      return updateContact(state, action.id, (contact) => ({
        ...contact,
        check: contact.result ?? 'nomatch',
        checkedOn: 'Checked today by you · phone and name',
      }));
    case 'contact/updated':
      return updateContact(state, action.id, (contact) =>
        applyContactEdit(contact, action.values, action.todayIso)
      );
    case 'contact/reassigned':
      return updateContact(state, action.id, (contact) => ({
        ...contact,
        staffId: action.staffId,
        history: withEntry(contact, action.entry),
      }));
    case 'contact/linked':
      return updateContact(state, action.id, (contact) => ({
        ...contact,
        check: 'linked',
        status: 'linked',
        due: false,
        next: 'None · handed to OPD',
        nextShort: '—',
        history: withEntry(contact, action.entry),
      }));
    case 'contact/dismissed':
      return updateContact(state, action.id, (contact) => ({
        ...contact,
        check: 'nomatch',
        checkedOn: 'Possible match dismissed today by you',
        history: withEntry(contact, action.entry),
      }));
    case 'contact/referred':
      return updateContact(state, action.id, (contact) => ({
        ...contact,
        history: withEntry(contact, action.entry),
      }));
    case 'contact/followed-up':
      return updateContact(state, action.id, (contact) => ({
        ...contact,
        due: action.due,
        next: action.next,
        status: action.status,
        nextShort: action.nextShort,
        history: withEntry(contact, action.entry),
      }));
  }
}
