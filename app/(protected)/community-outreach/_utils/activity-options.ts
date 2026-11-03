import { toIsoDate } from './outreach-dates';
import type { ActivityFormValues } from './activity-form-schema';

type ActivityType = ActivityFormValues['type'];

type Option = { value: string; label: string };

export const ACTIVITY_TYPE_OPTIONS: Array<Option & { description: string }> = [
  {
    value: 'camp',
    label: 'Wellness camp',
    description: 'Free consultations and screenings at a venue.',
  },
  {
    value: 'event',
    label: 'Awareness event',
    description: 'A talk or session for a group, school or association.',
  },
  {
    value: 'visit',
    label: 'Home visit',
    description: 'Staff visit a home to meet a person or family.',
  },
];

export const OUTREACH_STAFF = [
  { id: 'meera', name: 'Dr. Meera Nair', role: 'Physician', initials: 'MN' },
  { id: 'arjun', name: 'Dr. Arjun Das', role: 'Physician', initials: 'AD' },
  { id: 'anil', name: 'Anil Kumar', role: 'Outreach', initials: 'AK' },
  { id: 'lakshmi', name: 'Lakshmi Pillai', role: 'Outreach', initials: 'LP' },
  { id: 'rahul', name: 'Rahul Menon', role: 'Therapist', initials: 'RM' },
];

export const OFFER_OPTIONS: Record<ActivityType, Option[]> = {
  camp: [
    { value: 'consult', label: 'Free Ayurveda consultation' },
    { value: 'prakriti', label: 'Prakriti assessment' },
    { value: 'bp', label: 'BP and blood sugar check' },
    { value: 'demo', label: 'Therapy demonstration' },
    { value: 'talk', label: 'Short health talk' },
    { value: 'leaflet', label: 'Leaflets and brochures' },
  ],
  event: [
    { value: 'talk', label: 'Health talk' },
    { value: 'qa', label: 'Q&A with a doctor' },
    { value: 'demo', label: 'Therapy demonstration' },
    { value: 'diet', label: 'Diet and lifestyle tips' },
    { value: 'prakriti', label: 'Prakriti assessment' },
    { value: 'leaflet', label: 'Leaflets and brochures' },
  ],
  visit: [
    { value: 'consult', label: 'Introduce consultations' },
    { value: 'therapy', label: 'Discuss therapies' },
    { value: 'wellness', label: 'Wellness program' },
    { value: 'followup', label: 'Post-treatment check-in' },
    { value: 'leaflet', label: 'Leave leaflets' },
  ],
};

export const OUTCOME_OPTIONS: Option[] = [
  { value: 'interested', label: 'Interested · follow up' },
  { value: 'booked', label: 'Consultation booked' },
  { value: 'patient', label: 'Already a patient · pass to OPD' },
  { value: 'notint', label: 'Not interested' },
  { value: 'away', label: 'Not at home · revisit' },
];

export const REQUESTED_BY_OPTIONS = [
  'Family member called',
  'Referral from camp or event',
  'Existing patient referral',
  'Staff initiative',
];

export const SPEAKER_OPTIONS = ['Dr. Meera Nair', 'Dr. Arjun Das', 'Guest speaker'];

export const AUDIENCE_OPTIONS = [
  'Senior citizens',
  'Women’s self-help group',
  'School or college',
  'Residents’ association',
  'Workplace staff',
  'Religious or community group',
];

export const LANGUAGE_OPTIONS = ['Malayalam', 'English', 'Tamil', 'Hindi'];

export const DURATION_OPTIONS = ['45 minutes', '1 hour', '1.5 hours', '2 hours'];

export const FOLLOW_UP_BY_OPTIONS = ['Phone call', 'Another home visit', 'WhatsApp'];

export const ACTIVITY_COPY: Record<
  ActivityType,
  {
    pageTitle: string;
    venueLabel: string;
    venuePlaceholder: string;
    titlePlaceholder: string;
    whereHeading: string;
    offerHeading: string;
    reachLabel: string;
    summaryPlaceholder: string;
  }
> = {
  camp: {
    pageTitle: 'Log wellness camp',
    venueLabel: 'Venue',
    venuePlaceholder: 'e.g. Panchayat Hall',
    titlePlaceholder: 'e.g. Free Prakriti assessment & BP screening',
    whereHeading: 'Where',
    offerHeading: 'What will be offered',
    reachLabel: 'People reached (approx.)',
    summaryPlaceholder: 'Turnout, common concerns raised, what to do differently next time',
  },
  event: {
    pageTitle: 'Log awareness event',
    venueLabel: 'Venue or organisation',
    venuePlaceholder: 'e.g. Senior Citizens Forum',
    titlePlaceholder: 'Topic, e.g. Joint care in the monsoon',
    whereHeading: 'Where',
    offerHeading: 'Session details',
    reachLabel: 'Attendance (approx.)',
    summaryPlaceholder:
      'Questions asked, topics people wanted more on, invitation for a follow-up session',
  },
  visit: {
    pageTitle: 'Log home visit',
    venueLabel: 'House name or number',
    venuePlaceholder: 'e.g. Rose Villa, House 14',
    titlePlaceholder: 'e.g. Enquiry visit, knee pain',
    whereHeading: 'Household',
    offerHeading: 'Purpose of visit',
    reachLabel: '',
    summaryPlaceholder: '',
  },
};

const DEFAULT_STAFF: Record<ActivityType, string[]> = {
  camp: ['meera', 'anil'],
  event: ['meera', 'lakshmi'],
  visit: ['rahul'],
};

const DEFAULT_OFFERS: Record<ActivityType, string[]> = {
  camp: ['consult', 'prakriti', 'bp'],
  event: ['talk', 'qa', 'diet', 'leaflet'],
  visit: ['consult', 'therapy', 'leaflet'],
};

export function typeDefaults(type: ActivityType) {
  return {
    offers: DEFAULT_OFFERS[type],
    staffIds: DEFAULT_STAFF[type],
    leadId: DEFAULT_STAFF[type][0],
  };
}

export function defaultActivityValues(type: ActivityType = 'camp'): ActivityFormValues {
  return {
    type,
    status: 'planned',
    title: '',
    date: toIsoDate(new Date()),
    startTime: '09:00',
    endTime: '13:00',
    venue: '',
    area: '',
    address: '',
    person: '',
    personPhone: '',
    familyPresent: '',
    requestedBy: REQUESTED_BY_OPTIONS[0],
    reason: '',
    speaker: SPEAKER_OPTIONS[0],
    audience: AUDIENCE_OPTIONS[0],
    language: LANGUAGE_OPTIONS[0],
    expectedAudience: '',
    organiser: '',
    duration: DURATION_OPTIONS[0],
    notes: '',
    outcome: 'interested',
    nextDate: '',
    nextBy: FOLLOW_UP_BY_OPTIONS[0],
    visitNotes: '',
    reached: '',
    attachments: [],
    summary: '',
    ...typeDefaults(type),
  };
}
