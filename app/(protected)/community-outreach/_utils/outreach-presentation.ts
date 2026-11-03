import { OUTREACH_STAFF } from './activity-options';
import { formatShortDate } from './outreach-dates';
import type {
  ActivityType,
  ContactStatus,
  OutreachActivity,
  OutreachContact,
  PatientCheck,
} from './outreach-types';

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  camp: 'Wellness camp',
  event: 'Awareness event',
  visit: 'Home visit',
};

const ACTIVITY_TYPE_NOUN: Record<ActivityType, string> = {
  camp: 'camp',
  event: 'event',
  visit: 'visit',
};

export const ACTIVITY_TYPE_CLASS: Record<ActivityType, string> = {
  camp: 'border-success/30 bg-success/10 text-success',
  event: 'border-warning/30 bg-warning/10 text-warning',
  visit: 'border-primary/30 bg-primary/10 text-primary',
};

export const CONTACT_STATUS: Record<ContactStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'border-primary/30 bg-primary/10 text-primary' },
  tocall: { label: 'To call', className: 'border-warning/30 bg-warning/10 text-warning' },
  contacted: { label: 'Contacted', className: 'border-border bg-muted text-foreground' },
  sched: {
    label: 'Follow-up scheduled',
    className: 'border-success/30 bg-success/10 text-success',
  },
  booked: {
    label: 'Appointment booked',
    className: 'border-success/40 bg-success/20 text-success',
  },
  linked: {
    label: 'Linked to patient',
    className: 'border-procedure/30 bg-procedure/10 text-procedure',
  },
  closed: { label: 'Not interested', className: 'border-border bg-muted text-muted-foreground' },
};

export const PATIENT_CHECK: Record<PatientCheck, { label: string; className: string }> = {
  none: { label: 'Not checked', className: 'text-muted-foreground' },
  nomatch: { label: 'No match', className: 'text-foreground' },
  match: { label: 'Possible match', className: 'text-warning' },
  linked: { label: 'Linked', className: 'text-procedure' },
};

export function staffName(staffId: string) {
  return OUTREACH_STAFF.find((staff) => staff.id === staffId)?.name ?? 'Unassigned';
}

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function activityLocation(activity: OutreachActivity) {
  return [activity.venue, activity.area].filter(Boolean).join(', ');
}

export function activityShortLabel(activity: OutreachActivity) {
  return `${activity.area} ${ACTIVITY_TYPE_NOUN[activity.type]} · ${formatShortDate(activity.date)}`;
}

export function activitySourceLabel(activity: OutreachActivity) {
  return `${ACTIVITY_TYPE_LABEL[activity.type]} · ${activity.area} · ${formatShortDate(activity.date)}`;
}

export function contactActivity(contact: OutreachContact, activities: OutreachActivity[]) {
  return activities.find((activity) => activity.id === contact.activityId);
}
