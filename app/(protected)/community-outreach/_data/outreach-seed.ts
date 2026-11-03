import { defaultActivityValues } from '../_utils/activity-options';
import type {
  ContactHistoryEntry,
  OutreachActivity,
  OutreachContact,
  OutreachState,
  PatientMatch,
} from '../_utils/outreach-types';

type PatientDirectoryEntry = PatientMatch & { phone: string };

export const PATIENT_DIRECTORY: PatientDirectoryEntry[] = [
  {
    mrn: 'AYH-24-01872',
    name: 'Sreeja V.',
    phone: '9847021436',
    detail: 'Female · born 1979 · same phone number · last visit Mar 2025',
  },
  {
    mrn: 'AYH-23-00419',
    name: 'Suresh Babu K.',
    phone: '9037211584',
    detail: 'Male · born 1958 · same phone number · registered Jun 2023',
  },
];

function activity(
  id: string,
  baseContacts: number,
  baseDeclined: number,
  overrides: Partial<OutreachActivity>
): OutreachActivity {
  return { ...defaultActivityValues('camp'), id, baseContacts, baseDeclined, ...overrides };
}

const SEED_ACTIVITIES: OutreachActivity[] = [
  activity('a1', 0, 0, {
    type: 'camp',
    status: 'planned',
    title: 'Free Prakriti assessment & BP screening',
    date: '2026-11-08',
    startTime: '09:00',
    endTime: '13:00',
    venue: 'Panchayat Hall',
    area: 'Thrikkakara',
    staffIds: ['meera', 'anil'],
    leadId: 'meera',
  }),
  activity('a2', 0, 0, {
    type: 'visit',
    status: 'planned',
    title: 'Elderly care enquiry visits (3 homes)',
    date: '2026-11-05',
    startTime: '10:30',
    endTime: '13:30',
    venue: 'Three households',
    area: 'Kaloor',
    staffIds: ['rahul'],
    leadId: 'rahul',
    person: 'Households from the referral list',
    personPhone: '9446012345',
    reason: 'Families asked about therapy at home for elderly relatives.',
    offers: ['consult', 'therapy', 'leaflet'],
  }),
  activity('a3', 38, 2, {
    type: 'camp',
    status: 'completed',
    title: 'Free consultation & Prakriti screening',
    date: '2026-11-01',
    startTime: '09:00',
    endTime: '13:00',
    venue: 'Community Hall',
    area: 'Kakkanad',
    staffIds: ['meera', 'anil'],
    leadId: 'anil',
    reached: '120',
    summary: 'Strong turnout. Most questions were about back pain and digestion.',
  }),
  activity('a4', 22, 1, {
    type: 'event',
    status: 'completed',
    title: 'Joint care in the monsoon (talk)',
    date: '2026-10-29',
    startTime: '16:00',
    endTime: '17:00',
    venue: 'Senior Citizens Forum',
    area: 'Edappally',
    staffIds: ['lakshmi'],
    leadId: 'lakshmi',
    audience: 'Senior citizens',
    expectedAudience: '40',
    reached: '35',
    offers: ['talk', 'qa', 'diet', 'leaflet'],
  }),
  activity('a5', 3, 0, {
    type: 'visit',
    status: 'completed',
    title: 'Enquiry visits after referral',
    date: '2026-10-28',
    startTime: '11:00',
    endTime: '13:00',
    venue: 'Three households',
    area: 'Palarivattom',
    staffIds: ['rahul'],
    leadId: 'rahul',
    person: 'Referred households',
    personPhone: '9037211584',
    reason: 'Referral from the previous camp.',
    offers: ['consult', 'therapy'],
    outcome: 'interested',
  }),
  activity('a6', 51, 3, {
    type: 'camp',
    status: 'completed',
    title: 'Workplace wellness camp',
    date: '2026-10-24',
    startTime: '10:00',
    endTime: '14:00',
    venue: 'Infopark Phase 2',
    area: 'Kakkanad',
    staffIds: ['arjun', 'anil', 'lakshmi'],
    leadId: 'arjun',
    reached: '160',
  }),
  activity('a7', 17, 1, {
    type: 'event',
    status: 'completed',
    title: 'Women’s health and Ayurveda',
    date: '2026-10-20',
    startTime: '15:00',
    endTime: '16:00',
    venue: 'Kudumbashree unit',
    area: 'Vyttila',
    staffIds: ['meera'],
    leadId: 'meera',
    audience: 'Women’s self-help group',
    reached: '25',
    offers: ['talk', 'qa', 'leaflet'],
  }),
];

function entry(
  id: string,
  kind: ContactHistoryEntry['kind'],
  by: string,
  title: string,
  note: string,
  date: string
): ContactHistoryEntry {
  return { id, kind, by, title, note, date };
}

function addedAt(id: string, by: string, place: string, note: string, date: string) {
  return entry(id, 'out', by, `Added at ${place}`, note, date);
}

function contact(
  overrides: Partial<OutreachContact> &
    Pick<OutreachContact, 'id' | 'name' | 'phone' | 'activityId' | 'staffId'>
): OutreachContact {
  const kinds: Record<string, string> = {
    Therapy: 'therapy',
    Consultation: 'consult',
    Wellness: 'wellness',
  };
  const kind = kinds[(overrides.interest ?? '').split(' ')[0]];

  return {
    area: '',
    notes: overrides.history?.at(-1)?.note ?? '',
    interests: kind ? [kind] : [],
    address: 'Not given',
    interest: '',
    status: 'new',
    next: 'None',
    nextShort: '—',
    due: false,
    consent: true,
    consentText: '',
    check: 'none',
    result: null,
    match: null,
    checkedOn: '',
    history: [],
    addedInSession: false,
    ...overrides,
  };
}

const SEED_CONTACTS: OutreachContact[] = [
  contact({
    id: 'c1',
    name: 'Sreeja Varghese',
    phone: '+91 98470 21436',
    area: 'Kakkanad',
    address: 'Flat 4B, Green Meadows, Kakkanad',
    interest: 'Therapy · Panchakarma',
    activityId: 'a3',
    status: 'sched',
    staffId: 'anil',
    next: '05 Nov 2026 · call',
    nextShort: '05 Nov',
    consentText: 'Agreed at camp, 01 Nov · call and WhatsApp',
    check: 'match',
    match: PATIENT_DIRECTORY[0],
    history: [
      entry(
        'c1-h2',
        'fu',
        'Anil Kumar',
        'Phone call · interested',
        'Wants a 7-day Panchakarma. Asked about cost and leave days; call back after she checks dates.',
        '02 Nov 2026'
      ),
      addedAt(
        'c1-h1',
        'Anil Kumar',
        'Kakkanad wellness camp',
        'Attended Prakriti screening and met Dr. Meera Nair at the camp desk.',
        '01 Nov 2026'
      ),
    ],
  }),
  contact({
    id: 'c2',
    name: 'Mohammed Rafeeq',
    phone: '+91 94461 70852',
    area: 'Kakkanad',
    interest: 'Consultation · back pain',
    activityId: 'a6',
    status: 'booked',
    staffId: 'lakshmi',
    next: '04 Nov 2026 · OPD 11:00 AM',
    nextShort: '04 Nov',
    consentText: 'Agreed at camp, 24 Oct · call only',
    check: 'nomatch',
    checkedOn: 'Checked 25 Oct by Lakshmi Pillai · phone and name',
    history: [
      entry(
        'c2-h2',
        'fu',
        'Lakshmi Pillai',
        'Consultation booked',
        'Booked with Dr. Arjun Das, 04 Nov 11:00 AM. Asked to bring recent X-ray.',
        '26 Oct 2026'
      ),
      addedAt(
        'c2-h1',
        'Lakshmi Pillai',
        'Infopark wellness camp',
        'Desk job, lower back pain for 6 months.',
        '24 Oct 2026'
      ),
    ],
  }),
  contact({
    id: 'c3',
    name: 'Thankamma Joseph',
    phone: '+91 85475 33019',
    area: 'Edappally',
    address: 'Near St. George Church, Edappally',
    interest: 'Consultation · knee pain',
    activityId: 'a4',
    status: 'tocall',
    staffId: 'lakshmi',
    next: 'Today · call',
    nextShort: 'Today',
    due: true,
    consentText: 'Agreed at event, 29 Oct · call',
    check: 'none',
    result: 'match',
    match: {
      mrn: 'AYH-22-03311',
      name: 'Thankamma J.',
      detail: 'Female · born 1954 · different phone · same locality',
    },
    history: [
      addedAt(
        'c3-h1',
        'Lakshmi Pillai',
        'Edappally awareness talk',
        'Daughter’s number noted as alternate. Prefers morning calls.',
        '29 Oct 2026'
      ),
    ],
  }),
  contact({
    id: 'c4',
    name: 'Priya Raghavan',
    phone: '+91 99952 48107',
    area: 'Kakkanad',
    interest: 'Wellness program · stress & sleep',
    activityId: 'a6',
    status: 'contacted',
    staffId: 'anil',
    next: '06 Nov 2026 · WhatsApp',
    nextShort: '06 Nov',
    consentText: 'Agreed at camp, 24 Oct · WhatsApp preferred',
    check: 'nomatch',
    checkedOn: 'Checked 24 Oct by Anil Kumar · phone and name',
    history: [
      entry(
        'c4-h2',
        'fu',
        'Anil Kumar',
        'WhatsApp · program details sent',
        'Shared the 21-day wellness program schedule. Will reply after talking to family.',
        '30 Oct 2026'
      ),
      addedAt(
        'c4-h1',
        'Anil Kumar',
        'Infopark wellness camp',
        'Interested in yoga and sleep routine guidance.',
        '24 Oct 2026'
      ),
    ],
  }),
  contact({
    id: 'c5',
    name: 'Suresh Babu',
    phone: '+91 90372 11584',
    area: 'Palarivattom',
    address: 'TC 22/41, Temple Road, Palarivattom',
    interest: 'Therapy · Elakizhi',
    activityId: 'a5',
    status: 'linked',
    staffId: 'rahul',
    next: 'None · handed to OPD',
    consentText: 'Agreed at home visit, 28 Oct · call',
    check: 'linked',
    match: PATIENT_DIRECTORY[1],
    history: [
      entry(
        'c5-h2',
        'fu',
        'Rahul Menon',
        'Linked to existing patient',
        'Confirmed identity by phone and date of birth. Therapy enquiry passed to OPD.',
        '29 Oct 2026'
      ),
      addedAt(
        'c5-h1',
        'Rahul Menon',
        'Palarivattom home visit',
        'Previously treated here in 2023. Asking about Elakizhi for shoulder stiffness.',
        '28 Oct 2026'
      ),
    ],
  }),
  contact({
    id: 'c6',
    name: 'Fathima Beevi',
    phone: '+91 79076 52230',
    area: 'Vyttila',
    interest: 'Wellness program · women’s health',
    activityId: 'a7',
    status: 'closed',
    staffId: 'meera',
    consent: false,
    consentText: 'asked not to be contacted, 23 Oct',
    check: 'nomatch',
    checkedOn: 'Checked 20 Oct by Dr. Meera Nair · phone and name',
    history: [
      entry(
        'c6-h2',
        'fu',
        'Dr. Meera Nair',
        'Phone call · permission withdrawn',
        'Not interested right now and asked not to be called again.',
        '23 Oct 2026'
      ),
      addedAt(
        'c6-h1',
        'Dr. Meera Nair',
        'Vyttila awareness session',
        'Took the program leaflet.',
        '20 Oct 2026'
      ),
    ],
  }),
  contact({
    id: 'c7',
    name: 'Ajay Krishnan',
    phone: '+91 81295 64478',
    area: 'Kakkanad',
    interest: 'Consultation · digestion',
    activityId: 'a3',
    status: 'new',
    staffId: 'anil',
    next: 'Today · first call',
    nextShort: 'Today',
    due: true,
    consentText: 'Agreed at camp, 01 Nov · call',
    check: 'none',
    result: 'nomatch',
    history: [
      addedAt(
        'c7-h1',
        'Anil Kumar',
        'Kakkanad wellness camp',
        'Acidity after meals; wants a consultation on a Saturday.',
        '01 Nov 2026'
      ),
    ],
  }),
  contact({
    id: 'c8',
    name: 'Deepa Suresh',
    phone: '+91 97441 08263',
    area: 'Kakkanad',
    address: 'Villa 12, Palm Grove, Kakkanad',
    interest: 'Therapy · Abhyanga',
    activityId: 'a3',
    status: 'tocall',
    staffId: 'anil',
    next: 'Today · call',
    nextShort: 'Today',
    due: true,
    consentText: 'Agreed at camp, 01 Nov · call and WhatsApp',
    check: 'nomatch',
    checkedOn: 'Checked 01 Nov by Anil Kumar · phone and name',
    history: [
      addedAt(
        'c8-h1',
        'Anil Kumar',
        'Kakkanad wellness camp',
        'Asked about therapy packages for herself and her mother.',
        '01 Nov 2026'
      ),
    ],
  }),
];

export const SEED_STATE: OutreachState = {
  activities: SEED_ACTIVITIES,
  contacts: SEED_CONTACTS,
};
