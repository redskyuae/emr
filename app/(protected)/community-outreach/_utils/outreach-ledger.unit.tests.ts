import { describe, expect, it } from 'vitest';

import { SEED_STATE } from '../_data/outreach-seed';
import { defaultActivityValues } from './activity-options';
import type { ContactFormValues } from './contact-form-schema';
import {
  activityContactCount,
  buildActivity,
  buildContact,
  consentedContactCount,
  findPatientByPhone,
  nextId,
  outreachReducer,
  totalContactCount,
} from './outreach-ledger';

const contactValues: ContactFormValues = {
  name: ' Anjali Menon ',
  phone: '98470 21436',
  address: '',
  interests: ['consult', 'therapy'],
  notes: 'Prefers morning calls.',
  consent: true,
  activityId: 'a3',
};

function contactFor(overrides: Partial<ContactFormValues> = {}) {
  const activity = SEED_STATE.activities.find((item) => item.id === 'a3')!;

  return buildContact({ ...contactValues, ...overrides }, activity, '2026-11-02', 'c9');
}

describe('findPatientByPhone', () => {
  it('should match an existing patient by the last ten digits of the phone number', () => {
    expect(findPatientByPhone('+91 98470 21436')?.mrn).toBe('AYH-24-01872');
  });

  it('should return null for an unknown or incomplete phone number', () => {
    expect(findPatientByPhone('9000000000')).toBeNull();
    expect(findPatientByPhone('98470')).toBeNull();
  });
});

describe('buildContact', () => {
  it('should create a new contact assigned to the activity lead with a follow-up two days out', () => {
    const contact = contactFor();

    expect(contact).toMatchObject({
      name: 'Anjali Menon',
      phone: '+91 98470 21436',
      staffId: 'anil',
      status: 'new',
      next: '04 Nov 2026 · call',
      nextShort: '04 Nov',
      interest: 'Ayurveda consultation, Therapy (Panchakarma, Abhyanga…)',
      addedInSession: true,
    });
  });

  it('should flag a possible patient match without linking it', () => {
    const contact = contactFor();

    expect(contact.check).toBe('none');
    expect(contact.result).toBe('match');
    expect(contact.match?.mrn).toBe('AYH-24-01872');
  });

  it('should schedule no follow-up when permission to contact was not given', () => {
    const contact = contactFor({ consent: false, phone: '9000000000' });

    expect(contact.next).toBe('None · no permission');
    expect(contact.nextShort).toBe('—');
    expect(contact.result).toBe('nomatch');
  });
});

describe('outreachReducer', () => {
  it('should add a logged activity to the top of the list', () => {
    const activity = buildActivity(defaultActivityValues('event'), 'a8');
    const next = outreachReducer(SEED_STATE, { type: 'activity/added', activity });

    expect(next.activities[0].id).toBe('a8');
    expect(next.activities).toHaveLength(SEED_STATE.activities.length + 1);
  });

  it('should count contacts added in the session on top of the seeded count', () => {
    const next = outreachReducer(SEED_STATE, { type: 'contact/added', contact: contactFor() });
    const activity = next.activities.find((item) => item.id === 'a3')!;

    expect(activityContactCount(next, activity)).toBe(39);
    expect(totalContactCount(next)).toBe(totalContactCount(SEED_STATE) + 1);
  });

  it('should reveal the patient check result when records are checked', () => {
    const next = outreachReducer(SEED_STATE, { type: 'contact/checked', id: 'c7' });

    expect(next.contacts.find((c) => c.id === 'c7')?.check).toBe('nomatch');
  });

  it('should link a patient and hand the contact to OPD', () => {
    const next = outreachReducer(SEED_STATE, {
      type: 'contact/linked',
      id: 'c1',
      entry: { id: 'c1-h3', kind: 'fu', by: 'You', title: 'Linked', note: '', date: '02 Nov 2026' },
    });
    const linked = next.contacts.find((c) => c.id === 'c1')!;

    expect(linked).toMatchObject({ check: 'linked', status: 'linked', nextShort: '—' });
    expect(linked.history[0].id).toBe('c1-h3');
  });

  it('should dismiss a possible match as no match', () => {
    const next = outreachReducer(SEED_STATE, {
      type: 'contact/dismissed',
      id: 'c1',
      entry: { id: 'c1-h3', kind: 'fu', by: 'You', title: 'Dismissed', note: '', date: '' },
    });

    expect(next.contacts.find((c) => c.id === 'c1')?.check).toBe('nomatch');
  });

  it('should not mutate the previous state', () => {
    outreachReducer(SEED_STATE, { type: 'contact/checked', id: 'c7' });

    expect(SEED_STATE.contacts.find((c) => c.id === 'c7')?.check).toBe('none');
  });
});

describe('nextId', () => {
  it('should continue after the highest numeric suffix', () => {
    expect(nextId('a', SEED_STATE.activities)).toBe('a8');
    expect(nextId('c', SEED_STATE.contacts)).toBe('c9');
  });
});

describe('contact/updated', () => {
  const edit = (id: string, overrides: Partial<ContactFormValues>) => {
    const current = SEED_STATE.contacts.find((c) => c.id === id)!;
    const values: ContactFormValues = {
      name: current.name,
      phone: current.phone,
      address: '',
      interests: current.interests,
      notes: current.notes,
      consent: current.consent,
      activityId: current.activityId,
      ...overrides,
    };
    const next = outreachReducer(SEED_STATE, {
      type: 'contact/updated',
      id,
      values,
      todayIso: '2026-11-02',
    });

    return next.contacts.find((c) => c.id === id)!;
  };

  it('should update the details and record the edit in the history', () => {
    const contact = edit('c7', { name: ' Ajay K. ', address: 'Villa 3', notes: 'Call after 5 PM' });

    expect(contact).toMatchObject({
      name: 'Ajay K.',
      address: 'Villa 3',
      notes: 'Call after 5 PM',
    });
    expect(contact.history[0].title).toBe('Contact details edited');
  });

  it('should keep the seeded interest text unless the interests change', () => {
    expect(edit('c7', {}).interest).toBe('Consultation · digestion');
    expect(edit('c7', { interests: ['diet'] }).interest).toBe('Diet & lifestyle');
  });

  it('should reset the patient check when the phone number changes', () => {
    const contact = edit('c7', { phone: '9847021436' });

    expect(contact).toMatchObject({ phone: '+91 98470 21436', check: 'none', result: 'match' });
  });

  it('should clear the follow-up when permission to contact is withdrawn', () => {
    const contact = edit('c8', { consent: false });

    expect(contact).toMatchObject({ consent: false, due: false, nextShort: '—' });
    expect(contact.next).toBe('None · no permission');
  });
});

describe('contact/reassigned', () => {
  it('should change the assigned staff and log it', () => {
    const next = outreachReducer(SEED_STATE, {
      type: 'contact/reassigned',
      id: 'c7',
      staffId: 'meera',
      entry: { id: 'c7-h2', kind: 'fu', by: 'You', title: 'Reassigned', note: '', date: '' },
    });

    expect(next.contacts.find((c) => c.id === 'c7')).toMatchObject({ staffId: 'meera' });
  });
});

describe('consentedContactCount', () => {
  it('should subtract seeded and newly added contacts who declined', () => {
    expect(totalContactCount(SEED_STATE)).toBe(131);
    expect(consentedContactCount(SEED_STATE)).toBe(124);

    const declined = outreachReducer(SEED_STATE, {
      type: 'contact/added',
      contact: contactFor({ consent: false }),
    });

    expect(consentedContactCount(declined)).toBe(124);
    expect(totalContactCount(declined)).toBe(132);
  });
});
